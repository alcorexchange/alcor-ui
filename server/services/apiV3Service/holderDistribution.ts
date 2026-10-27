import axios from 'axios'

import { totalSupply } from './geckoAdapter'

const TOP_HOLDERS_LIMIT = 100
const LIGHTAPI_TIMEOUT_MS = 30_000

/**
 * Who a balance belongs to. Only `wallet` is somebody's own stack: pools and
 * protocol contracts hold tokens for many accounts at once, an exchange holds
 * them for its users, and burned tokens are nobody's.
 */
export type HolderKind = 'pool' | 'exchange' | 'protocol' | 'burn' | 'wallet'

/** Wallet ranks split into disjoint slices so the shares add up. */
const WALLET_BUCKETS = [
  { key: 'topWallet', from: 0, to: 1 },
  { key: 'wallets2to10', from: 1, to: 10 },
  { key: 'wallets11to50', from: 10, to: 50 },
] as const

/** Top 10 wallets' share of the supply held in wallets, highest threshold first. */
const VERDICTS = [
  { min: 70, verdict: 'highly_concentrated' },
  { min: 45, verdict: 'concentrated' },
  { min: 25, verdict: 'moderate' },
  { min: 0, verdict: 'well_distributed' },
] as const

type Verdict = typeof VERDICTS[number]['verdict']

type Segment = { amount: number, share: number }

function holderKinds(network: Network): Map<string, HolderKind> {
  const groups: [HolderKind, (string | undefined)[]][] = [
    ['pool', [network.contract, network.amm?.contract]],
    ['protocol', [network.otc?.contract, ...(network.PROTOCOL_ACCOUNTS ?? [])]],
    ['exchange', [...(network.CEX_CONTRACTS ?? []), ...(network.EXCHANGE_ACCOUNTS ?? [])]],
    ['burn', network.BURN_ACCOUNTS ?? []],
  ]

  const kinds = new Map<string, HolderKind>()
  for (const [kind, accounts] of groups) {
    for (const account of accounts) {
      if (account) kinds.set(account, kind)
    }
  }
  return kinds
}

/**
 * Top holders as LightAPI lists them, largest first. A balance row stays open
 * after its owner sent everything away, so empty ones are dropped.
 */
async function fetchTopHolders(network: Network, contract: string, symbol: string) {
  const url = `${network.lightapi}/api/topholders/${network.name}/${contract}/${symbol}/${TOP_HOLDERS_LIMIT}`
  const { data } = await axios.get<[string, string][]>(url, { timeout: LIGHTAPI_TIMEOUT_MS })

  return data
    .map(([account, amount]) => ({ account, amount: parseFloat(amount) }))
    .filter((holder) => holder.amount > 0)
}

function sumAmount(holders: { amount: number }[]): number {
  return holders.reduce((total, holder) => total + holder.amount, 0)
}

function pickVerdict(topTenWalletShare: number): Verdict {
  return VERDICTS.find(({ min }) => topTenWalletShare >= min)!.verdict
}

/**
 * How a token's supply splits between pools, protocol contracts, exchanges and
 * wallets. Shares are of the live supply: issued minus burned. Concentration is
 * judged on wallets only, against the supply held in wallets.
 *
 * The chain's system token gets no verdict: staking, resources and exchanges
 * hold most of it by design, so a concentration label would only mislead.
 */
export async function buildHolderDistribution(network: Network, token: { id: string, contract: string, symbol: string }) {
  const [rawHolders, supply] = await Promise.all([
    fetchTopHolders(network, token.contract, token.symbol),
    totalSupply(network, token.contract, token.symbol),
  ])

  const kinds = holderKinds(network)
  const holders = rawHolders.map((holder) => ({ ...holder, kind: kinds.get(holder.account) ?? 'wallet' as HolderKind }))
  const ofKind = (kind: HolderKind) => holders.filter((holder) => holder.kind === kind)

  const burned = sumAmount(ofKind('burn'))
  const liveSupply = supply === null ? null : Math.max(0, supply - burned)
  const isSystemToken = token.id === network.baseToken.id

  const shareOf = (amount: number) => (liveSupply ? (amount / liveSupply) * 100 : null)
  const items = holders.map((holder) => ({ ...holder, share: holder.kind === 'burn' ? null : shareOf(holder.amount) }))

  if (!liveSupply || holders.length === 0) {
    return { supply, burned, liveSupply, isSystemToken, verdict: null, topTenWalletShare: null, segments: null, holders: items }
  }

  const segment = (amount: number): Segment => ({ amount, share: shareOf(amount)! })

  const custody = {
    pool: segment(sumAmount(ofKind('pool'))),
    protocol: segment(sumAmount(ofKind('protocol'))),
    exchange: segment(sumAmount(ofKind('exchange'))),
  }

  const wallets = ofKind('wallet')
  const walletSegments = Object.fromEntries(
    WALLET_BUCKETS.map((bucket) => [bucket.key, segment(sumAmount(wallets.slice(bucket.from, bucket.to)))])
  ) as Record<typeof WALLET_BUCKETS[number]['key'], Segment>

  const listed = [...Object.values(custody), ...Object.values(walletSegments)]
  const rest = segment(Math.max(0, liveSupply - sumAmount(listed)))

  const walletSupply = liveSupply - custody.pool.amount - custody.protocol.amount - custody.exchange.amount
  const topTenWalletShare = walletSupply > 0 ? (sumAmount(wallets.slice(0, 10)) / walletSupply) * 100 : null

  return {
    supply,
    burned,
    liveSupply,
    isSystemToken,
    verdict: isSystemToken || topTenWalletShare === null ? null : pickVerdict(topTenWalletShare),
    topTenWalletShare,
    segments: { ...custody, ...walletSegments, rest },
    holders: items,
  }
}
