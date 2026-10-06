require('dotenv').config()

import { networks } from '../../../config'
import { initialUpdate } from '.'

// Rebuilds one chain's pool, tick and position caches from the chain itself:
//
//   node lib/server/services/swapV2Service/reindex.js wiretest
//
// The updater refreshes a pool only when an action touches it, so a cache that
// was filled wrongly — or never filled at all — stays that way until the next
// mint, burn or swap on that exact pool. This repairs one on demand, which is
// what a fix to how the tables were read in the first place needs.

const chain = process.argv[2]

if (!networks[chain]?.amm?.contract) {
  const withAmm = Object.keys(networks).filter(name => networks[name]?.amm?.contract)
  console.error(`usage: reindex <chain>, one of: ${withAmm.join(', ')}`)
  process.exit(1)
}

initialUpdate(chain, undefined, true)
  .then(() => {
    console.log(`[${chain}] reindexed`)
    process.exit(0)
  })
  .catch(e => {
    console.error(`[${chain}] reindex failed:`, e)
    process.exit(1)
  })
