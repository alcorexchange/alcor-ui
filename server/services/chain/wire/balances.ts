import { fetchAllRows } from '../../../../utils/eosjs'
import type { Balance } from '../types'

// Wire has no light API, so balances are read straight off the chain. The
// account's balances live in `<token contract>::accounts` scoped by account
// name, one contract at a time — hence the token contract list.
//
// The inverse sweep (every holder of one contract) is a single paginated call
// on Wire: get_table_rows with the scope left out returns every scope at once,
// with the scope riding along in the row key. That is what a full balance index
// would be built on, once the number of token contracts makes this loop too wide.

export async function getWireBalances(rpc: any, tokenContracts: string[], account: string): Promise<Balance[]> {
  const results = await Promise.all(
    tokenContracts.map(async (contract) => {
      try {
        const rows = await fetchAllRows(rpc, { code: contract, scope: account, table: 'accounts' })

        return rows.map((row: any) => {
          const [amount, currency] = String(row.balance).split(' ')
          return { contract, currency, amount }
        })
      } catch (e) {
        console.error(`[wire] failed to read ${contract} balances for ${account}:`, e.message)
        return []
      }
    })
  )

  return results.flat()
}
