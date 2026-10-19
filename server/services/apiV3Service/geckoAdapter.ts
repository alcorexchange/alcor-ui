// The AMM pools of one chain for GeckoTerminal, in its DEX adapter shape:
// /latest-block, /asset, /pair and /events over a block range.
// Served at /api/v3/feed/gecko/<chain> for every feed chain (wax, xpr, eos, telos).
//
// It replaces the WAX team's gecko-api.wax.io and keeps its ids, so GeckoTerminal keeps
// the history it indexed: a pair is `swap.alcor:<pool id>`, an asset `WAX-wax-eosio.token`.
//
// Events come from the swaps the updater stores. A block counts as indexed once the AMM
// streamer has passed it, and the streamer stores a block's swaps before it moves on.

import { Settings, Swap, SwapPool } from '../../models'
import { asyncRouter } from '../asyncRouter'
import { getChain } from '../chain'
import { getAccountAsKey } from '../updaterService/streamers'
import { chainSlug, networkBySlug } from './feed'

export const geckoAdapter = asyncRouter()

// About 14 hours of WAX blocks; GeckoTerminal asks for far less at a time.
const MAX_EVENTS_RANGE = 100000

// Antelope chains make at most one block per half second.
const BLOCK_MS = 500

const SUPPLY_TTL_MS = 10 * 60 * 1000
const MAX_CACHED_BLOCKS = 10000

const unixSeconds = (time: Date | number) => Math.floor(new Date(time).getTime() / 1000)

geckoAdapter.param('chain', (req, res, next, slug) => {
  const network = networkBySlug.get(slug)
  if (!network) return res.status(404).json({ error: `Unknown chain ${slug}` })

  res.locals.network = network
  next()
})

// The last block whose swaps are all stored.
async function indexedBlock(network): Promise<number> {
  const settings: any = await Settings.findOne({ chain: network.name }).select('last_block_num').lean()
  const nextBlock = settings?.last_block_num?.[getAccountAsKey(network.amm.contract)]
  if (!nextBlock) throw new Error(`${network.name}: the AMM streamer has saved no progress`)

  return nextBlock - 1
}

const blockTimes = new Map<string, number>()

// Unix seconds of a block, from the chain. Nodes keep only recent blocks.
async function blockTime(network, blockNumber: number): Promise<number> {
  const key = `${network.name}:${blockNumber}`
  if (blockTimes.has(key)) return blockTimes.get(key)

  const { timestamp } = await getChain(network.name).rpc().fetch('/v1/chain/get_block_info', { block_num: blockNumber })
  const time = unixSeconds(Date.parse(`${timestamp}Z`))

  if (blockTimes.size >= MAX_CACHED_BLOCKS) blockTimes.clear()
  blockTimes.set(key, time)

  return time
}

// A time range holding every swap of blocks fromBlock..toBlock, for the swaps' time index.
// Blocks are at least BLOCK_MS apart, so a block's time is bounded by any later block's,
// and the latest swap stored before fromBlock bounds the range from below.
async function swapTimeRange(network, fromBlock: number, toBlock: number, latest: number): Promise<{ $gte: Date, $lte: Date }> {
  const latestMs = (await blockTime(network, latest)) * 1000
  const end = new Date(latestMs - (latest - toBlock) * BLOCK_MS)

  // Latest time block fromBlock - 1 can have; a swap stored by then may still be later in the chain.
  let bound = latestMs - (latest - fromBlock + 1) * BLOCK_MS

  while (true) {
    const s: any = await Swap.findOne({ chain: network.name, time: { $lte: new Date(bound) }, block_num: { $exists: true } })
      .sort({ time: -1 })
      .select('block_num time')
      .lean()

    if (!s) return { $gte: new Date(0), $lte: end }
    if (s.block_num < fromBlock) return { $gte: s.time, $lte: end }

    bound = s.time.getTime() - (s.block_num - fromBlock + 1) * BLOCK_MS
  }
}

const supplies = new Map<string, { supply: number | null, at: number }>()

// Null when the token's contract no longer has a `stat` table in its ABI, so no node can read its supply.
async function totalSupply(network, contract: string, symbol: string): Promise<number | null> {
  const key = `${network.name}:${contract}:${symbol}`
  const cached = supplies.get(key)
  if (cached && Date.now() - cached.at < SUPPLY_TTL_MS) return cached.supply

  let supply: number | null
  try {
    const stats = await getChain(network.name).rpc().get_currency_stats(contract, symbol)
    supply = parseFloat(stats[symbol].supply)
  } catch (e) {
    if (e.json?.error?.name !== 'contract_table_query_exception') throw e
    supply = null
  }

  supplies.set(key, { supply, at: Date.now() })
  return supply
}

// `WAX-wax-eosio.token`
function assetId(network, token): string {
  return `${token.symbol}-${chainSlug(network)}-${token.contract}`
}

// The token an asset id names: `WAX-wax-eosio.token`, or `eosio.token:WAX` as gecko-api.wax.io took it.
function parseAssetId(network, id: string): { symbol: string, contract: string } | null {
  const [contract, symbol] = id.split(':')
  if (symbol) return { symbol, contract }

  const separator = `-${chainSlug(network)}-`
  const at = id.indexOf(separator)
  if (at < 1) return null

  return { symbol: id.slice(0, at), contract: id.slice(at + separator.length) }
}

function pairId(network, poolId: number): string {
  return `${network.amm.contract}:${poolId}`
}

// Price of tokenA in tokenB from the pool's sqrt price, a Q64.64 number.
function poolPrice(sqrtPriceX64: string, pool): number {
  const sqrtPrice = Number(BigInt(sqrtPriceX64)) / 2 ** 64

  return sqrtPrice ** 2 * 10 ** (pool.tokenA.decimals - pool.tokenB.decimals)
}

// Positive amounts went into the pool, negative ones came out of it.
function swapEvent(network, s, pool, txnIndex: number, eventIndex: number) {
  const amounts = s.tokenA > 0
    ? { asset0In: s.tokenA, asset1Out: -s.tokenB }
    : { asset1In: s.tokenB, asset0Out: -s.tokenA }

  return {
    block: { blockNumber: s.block_num, blockTimestamp: unixSeconds(s.time) },
    eventType: 'swap',
    txnId: s.trx_id,
    txnIndex,
    eventIndex,
    maker: s.sender,
    pairId: pairId(network, s.pool),
    ...amounts,
    priceNative: poolPrice(s.sqrtPriceX64, pool),
    // Swaps stored before the updater kept reserves have none.
    ...(s.reserveA != null && { reserves: { asset0: s.reserveA, asset1: s.reserveB } }),
  }
}

geckoAdapter.get('/:chain/latest-block', async (req, res) => {
  const { network } = res.locals
  const blockNumber = await indexedBlock(network)

  res.json({ block: { blockNumber, blockTimestamp: await blockTime(network, blockNumber) } })
})

geckoAdapter.get('/:chain/asset', async (req, res) => {
  const { network } = res.locals
  const token = parseAssetId(network, String(req.query.id || ''))
  if (!token) return res.status(400).json({ error: 'Use ?id=SYMBOL-<chain>-CONTRACT or ?id=CONTRACT:SYMBOL' })

  const tokenId = `${token.symbol.toLowerCase()}-${token.contract}`
  const pool: any = await SwapPool.findOne({ chain: network.name, $or: [{ 'tokenA.id': tokenId }, { 'tokenB.id': tokenId }] })
    .select('tokenA tokenB')
    .lean()
  if (!pool) return res.status(404).json({ error: 'Asset not found' })

  const { symbol, contract, decimals } = pool.tokenA.id === tokenId ? pool.tokenA : pool.tokenB
  const supply = await totalSupply(network, contract, symbol)

  res.json({
    asset: {
      id: assetId(network, { symbol, contract }),
      name: symbol,
      symbol,
      decimals,
      ...(supply != null && { totalSupply: supply }),
    },
  })
})

geckoAdapter.get('/:chain/pair', async (req, res) => {
  const { network } = res.locals
  const [dexKey, id] = String(req.query.id || '').split(':')
  if (dexKey !== network.amm.contract || !/^\d+$/.test(id)) return res.status(404).json({ error: 'Pair not found' })

  const pool: any = await SwapPool.findOne({ chain: network.name, id: Number(id) }).select('id tokenA tokenB fee creator').lean()
  if (!pool) return res.status(404).json({ error: 'Pair not found' })

  res.json({
    pair: {
      id: pairId(network, pool.id),
      dexKey,
      asset0Id: assetId(network, pool.tokenA),
      asset1Id: assetId(network, pool.tokenB),
      // The pool fee is in hundredths of a basis point: 3000 is 0.3%.
      feeBps: pool.fee / 100,
      ...(pool.creator && { creator: pool.creator }),
    },
  })
})

geckoAdapter.get('/:chain/events', async (req, res) => {
  const { network } = res.locals
  const [fromBlock, toBlock] = [Number(req.query.fromBlock), Number(req.query.toBlock)]

  if (!Number.isInteger(fromBlock) || !Number.isInteger(toBlock) || fromBlock < 1 || toBlock < fromBlock) {
    return res.status(400).json({ error: 'fromBlock and toBlock must be block numbers, fromBlock <= toBlock' })
  }
  if (toBlock - fromBlock >= MAX_EVENTS_RANGE) {
    return res.status(400).json({ error: `At most ${MAX_EVENTS_RANGE} blocks at a time` })
  }

  const latest = await indexedBlock(network)
  if (toBlock > latest) return res.status(400).json({ error: `toBlock is past the latest indexed block ${latest}` })

  const swaps: any[] = await Swap.find({
    chain: network.name,
    time: await swapTimeRange(network, fromBlock, toBlock, latest),
    block_num: { $gte: fromBlock, $lte: toBlock },
  })
    .select('pool trx_id sender tokenA tokenB sqrtPriceX64 reserveA reserveB time block_num')
    .lean()

  const pools: any[] = await SwapPool.find({ chain: network.name, id: { $in: [...new Set(swaps.map(s => s.pool))] } })
    .select('id tokenA.decimals tokenB.decimals')
    .lean()
  const poolById = new Map(pools.map(p => [p.id, p]))

  // A block's swaps are stored in execution order, so _id orders them within it.
  swaps.sort((a, b) => a.block_num - b.block_num || String(a._id).localeCompare(String(b._id)))

  const events = []
  let block = 0
  let txnIndexes = new Map<string, number>()
  let eventIndexes = new Map<string, number>()

  for (const s of swaps) {
    const pool = poolById.get(s.pool)
    if (!pool) continue

    if (s.block_num !== block) {
      block = s.block_num
      txnIndexes = new Map()
      eventIndexes = new Map()
    }

    if (!txnIndexes.has(s.trx_id)) txnIndexes.set(s.trx_id, txnIndexes.size)
    const eventIndex = eventIndexes.get(s.trx_id) ?? 0
    eventIndexes.set(s.trx_id, eventIndex + 1)

    events.push(swapEvent(network, s, pool, txnIndexes.get(s.trx_id), eventIndex))
  }

  res.json({ events })
})
