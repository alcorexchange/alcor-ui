import config from '../../../config'
import { Market, SwapPool } from '../../models'
import { getSubscriber } from '../redis'

type AccountUpdate = {
  balances: Set<string>
  balancesAll: boolean
  orders: Set<number>
  positions: Set<number>
  accountLimits: boolean
}

const CACHE_TTL_MS = 5 * 60 * 1000
const marketCache = new Map<string, { value: any, expires: number }>()
const poolCache = new Map<string, { value: any, expires: number }>()

function getCacheEntry(map: Map<string, { value: any, expires: number }>, key: string) {
  const entry = map.get(key)
  if (entry && entry.expires > Date.now()) return entry.value
  if (entry) map.delete(key)
  return null
}

async function getMarket(chain: string, id: number) {
  const key = `${chain}:${id}`
  const cached = getCacheEntry(marketCache, key)
  if (cached) return cached
  const market = await Market.findOne({ chain, id }).lean()
  if (market) marketCache.set(key, { value: market, expires: Date.now() + CACHE_TTL_MS })
  return market
}

async function getPool(chain: string, id: number) {
  const key = `${chain}:${id}`
  const cached = getCacheEntry(poolCache, key)
  if (cached) return cached
  const pool = await SwapPool.findOne({ chain, id }).lean()
  if (pool) poolCache.set(key, { value: pool, expires: Date.now() + CACHE_TTL_MS })
  return pool
}

function getUpdate(map: Map<string, AccountUpdate>, account: string) {
  if (!map.has(account)) {
    map.set(account, {
      balances: new Set(),
      balancesAll: false,
      orders: new Set(),
      positions: new Set(),
      accountLimits: false
    })
  }
  return map.get(account)
}

function addBalance(update: AccountUpdate, contract?: string, symbol?: string) {
  if (!contract || !symbol) {
    update.balancesAll = true
    update.balances.clear()
    return
  }
  if (!update.balancesAll) update.balances.add(`${symbol}@${contract}`)
}

function addMarketBalances(update: AccountUpdate, market?: any) {
  if (!market) {
    update.balancesAll = true
    update.balances.clear()
    return
  }
  addBalance(update, market.base_token?.contract, market.base_token?.symbol?.name)
  addBalance(update, market.quote_token?.contract, market.quote_token?.symbol?.name)
}

function addPoolBalances(update: AccountUpdate, pool?: any) {
  if (!pool) {
    update.balancesAll = true
    update.balances.clear()
    return
  }
  addBalance(update, pool.tokenA?.contract, pool.tokenA?.symbol)
  addBalance(update, pool.tokenB?.contract, pool.tokenB?.symbol)
}

function toPayload(chain: string, account: string, update: AccountUpdate, meta: any) {
  const balances = update.balancesAll
    ? null
    : Array.from(update.balances).map((id) => {
      const [symbol, contract] = id.split('@')
      return { symbol, contract }
    })

  return {
    v: 2,
    chain,
    account,
    balances,
    balancesAll: update.balancesAll,
    orders: Array.from(update.orders),
    positions: Array.from(update.positions),
    accountLimits: update.accountLimits,
    meta
  }
}

export function initAccountUpdates(io) {
  getSubscriber().pSubscribe('chainAction:*', async (message) => {
    let action
    try {
      action = JSON.parse(message)
    } catch (e) {
      console.error('accountUpdates: bad message', e)
      return
    }

    try {
      const { chain, account: contract, name, data, trx_id, block_num, block_time } = action
      const network = config.networks?.[chain]
      if (!network) return

      const spotContract = network.contract
      const swapContract = network.amm?.contract
      const updates = new Map<string, AccountUpdate>()

      const meta = { contract, action: name, trx_id, block_num, block_time }

      if (contract === swapContract) {
        const poolId = Number(data?.poolId ?? data?.pool_id)
        const posId = Number(data?.posId ?? data?.pos_id)

        if (['logswap', 'logmint', 'logburn', 'logcollect', 'logtransfer'].includes(name)) {
          const pool = await getPool(chain, poolId)

          if (name === 'logswap') {
            const accounts = [data?.sender, data?.recipient].filter(Boolean)
            for (const acc of accounts) {
              const update = getUpdate(updates, acc)
              addPoolBalances(update, pool)
            }
          }

          if (name === 'logmint' || name === 'logburn') {
            const owner = data?.owner
            if (owner) {
              const update = getUpdate(updates, owner)
              update.positions.add(posId)
              addPoolBalances(update, pool)
            }
          }

          if (name === 'logcollect') {
            const owner = data?.owner
            const recipient = data?.recipient
            if (owner) {
              const update = getUpdate(updates, owner)
              update.positions.add(posId)
              addPoolBalances(update, pool)
            }
            if (recipient && recipient !== owner) {
              const update = getUpdate(updates, recipient)
              addPoolBalances(update, pool)
            }
          }

          if (name === 'logtransfer') {
            const from = data?.from
            const to = data?.to
            const fromPosId = Number(data?.fromPosId ?? data?.from_pos_id)
            const toPosId = Number(data?.toPosId ?? data?.to_pos_id)

            if (from) {
              const update = getUpdate(updates, from)
              if (!Number.isNaN(fromPosId)) update.positions.add(fromPosId)
            }
            if (to) {
              const update = getUpdate(updates, to)
              if (!Number.isNaN(toPosId)) update.positions.add(toPosId)
            }
          }
        }
      }

      if (contract === spotContract) {
        const marketId = Number(data?.market_id ?? data?.marketId ?? data?.market)
        const market = Number.isNaN(marketId) ? null : await getMarket(chain, marketId)

        const markOrders = (acc: string) => {
          if (!acc) return
          const update = getUpdate(updates, acc)
          if (!Number.isNaN(marketId)) update.orders.add(marketId)
          update.accountLimits = true
          addMarketBalances(update, market)
        }

        if (name === 'buyreceipt' || name === 'sellreceipt') {
          const order = data?.buy_order || data?.sell_order || data?.order || data?.buyorder || data?.sellorder
          const acc = order?.account || data?.account
          markOrders(acc)
        }

        if (name === 'cancelbuy' || name === 'cancelsell') {
          const acc = data?.executor || data?.account
          markOrders(acc)
        }

        if (name === 'buymatch' || name === 'sellmatch') {
          const record = data?.record || data
          markOrders(record?.bidder)
          markOrders(record?.asker)
        }
      }

      if (updates.size === 0) return

      for (const [account, update] of updates.entries()) {
        const payload = toPayload(chain, account, update, meta)
        io.to(`account:${chain}.${account}`).emit('account:update-v2', payload)
      }
    } catch (e) {
      console.error('accountUpdates: handler error', e)
    }
  })
}
