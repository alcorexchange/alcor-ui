import { getPlatformContracts } from '../../utils'
import { getChain } from './index'

/**
 * TVL held by the platform's own contracts, valued with the given token list.
 * Chain-agnostic: where the balances come from is the adapter's business.
 */
export async function fetchPlatformBalances(
  network: Network,
  tokens: any[],
  options: { priceField?: 'safe_usd_price' | 'usd_price' } = {}
) {
  const chain = getChain(network.name)
  const contracts = getPlatformContracts(network)
  const priceField = options.priceField === 'usd_price' ? 'usd_price' : 'safe_usd_price'

  const tokenPriceMap = new Map<string, number>(tokens.map(t => [
    t.id,
    Number.isFinite(Number(t?.[priceField])) ? Number(t[priceField]) : 0
  ]))

  const tokenContracts = [...new Set(tokens.map(t => t.contract).filter(Boolean))]

  const results = await Promise.all(
    contracts.map(async (account) => ({
      account,
      balances: await chain.getBalances(account, tokenContracts)
    }))
  )

  const tokenTvlMap = new Map<string, number>()
  const contractTvlMap = new Map<string, number>()

  for (const { account, balances } of results) {
    let contractTvl = 0

    for (const balance of balances) {
      const tokenId = (balance.currency + '-' + balance.contract).toLowerCase()
      const price = tokenPriceMap.get(tokenId) ?? 0
      const tvl = parseFloat(balance.amount) * price

      tokenTvlMap.set(tokenId, (tokenTvlMap.get(tokenId) || 0) + tvl)
      contractTvl += tvl
    }

    contractTvlMap.set(account, contractTvl)
  }

  return { tokenTvlMap, contractTvlMap }
}
