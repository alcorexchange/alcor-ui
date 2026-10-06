// Read-only regression check: the existing chains still work through the new
// chain adapter. Touches neither Mongo nor Redis.
//   npx ts-node tools/check-antelope-chain.ts [chain]

import { fetchAllRows } from '../utils/eosjs'
import { getChain } from '../server/services/chain'

const CHAIN = process.argv[2] || 'eos'

async function main() {
  const chain = getChain(CHAIN)
  const { network } = chain
  const rpc = chain.rpc()

  const info = await rpc.get_info()
  console.log(`${CHAIN}: head ${info.head_block_num} (${info.server_version_string})`)

  // Bounded on purpose: the mainnet pools tables run to thousands of rows and
  // this is a wiring check, not a sync.
  const pools = await fetchAllRows(rpc, {
    code: network.amm.contract,
    scope: network.amm.contract,
    table: 'pools',
    limit: 5,
    upper_bound: 9,
  })
  console.log(`pools 0..9: ${pools.length}, first: #${pools[0]?.id} ${pools[0]?.tokenA?.quantity} / ${pools[0]?.tokenB?.quantity}`)

  const balances = await chain.getBalances(network.amm.contract, [])
  console.log(`balances of ${network.amm.contract}: ${balances.length} tokens`)

  console.log(`system price: $${await chain.getSystemUsdPrice()}`)
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })
