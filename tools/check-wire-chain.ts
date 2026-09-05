// Read-only smoke test for the Wire chain adapter. Touches neither Mongo nor Redis.
//   WIRE_HTTP_PROXY=http://127.0.0.1:1082 npx ts-node tools/check-wire-chain.ts

import { fetchAllRows } from '../utils/eosjs'
import { getChain } from '../server/services/chain'

const CHAIN = 'wiretest'

async function main() {
  const chain = getChain(CHAIN)
  const { network } = chain
  const rpc = chain.rpc()

  const info = await rpc.get_info()
  console.log(`chain ${info.chain_id.slice(0, 16)}… head ${info.head_block_num} (${info.server_version_string})`)

  const pools = await fetchAllRows(rpc, {
    code: network.amm.contract,
    scope: network.amm.contract,
    table: 'pools',
  })
  console.log(`\npools: ${pools.length}`)
  for (const p of pools) {
    console.log(`  #${p.id} ${p.tokenA.quantity} / ${p.tokenB.quantity} fee=${p.fee} tick=${p.currSlot?.tick} liq=${p.liquidity}`)
  }

  // Negative tick ids exercise the JSON bound encoding: the node orders them as
  // unsigned, so paging past one is where a scalar lower_bound would 500.
  const ticks = await fetchAllRows(rpc, { code: network.amm.contract, scope: 0, table: 'ticks' })
  console.log(`\nticks in pool 0: ${ticks.length} -> ${ticks.map(t => t.id).join(', ')}`)

  const positions = await fetchAllRows(rpc, { code: network.amm.contract, scope: 0, table: 'positions' })
  console.log(`positions in pool 0: ${positions.length} -> ${positions.map(p => `${p.owner}[${p.tickLower},${p.tickUpper}]`).join(', ')}`)

  const tokenContracts = ['sysio.token', 'testtoken']
  const balances = await chain.getBalances('alice', tokenContracts)
  console.log(`\nbalances of alice: ${balances.map(b => `${b.amount} ${b.currency}@${b.contract}`).join(', ')}`)

  console.log(`system price: $${await chain.getSystemUsdPrice()}`)

  // Same call the streamer makes, over the last few hundred blocks.
  const from = info.head_block_num - 200
  const traces = await rpc.fetch('/v1/trace_api/get_actions', {
    block_num_start: from,
    block_num_end: from + 999,
    account: network.amm.contract,
  })
  console.log(`\ntrace_api scanned ${traces.block_num_start}..${traces.block_num_end}, ${network.amm.contract} actions: ${(traces.actions || []).length}`)
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })
