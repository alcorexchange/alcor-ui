import schedule from 'node-schedule'

import config from '../../../config'
import { initialUpdate as swapInitialUpdate } from '../swapV2Service'

import { getSettings } from '../../utils'
import { updateGlobalStats } from './analytics'
import { updateMarkets, newMatch } from './markets'
import { newSwapAction, updatePoolsStats, updatePositionsAggregation } from './swap'
import { updateCMSucid, updateSystemPrice, updateTokensPrices } from './prices'
import { updateTokenScores } from './tokenScores'
import { startTokenHoldersUpdater } from './tokenHolders'

import { streamByTrace, streamByGreymass } from './streamers'

const pLimit = require('p-limit')
const limit = pLimit(2)

export function startUpdaters() {
  const chains = process.env.NETWORK
    ? [process.env.NETWORK]
    : ['eos', 'wax', 'proton', 'telos', 'ultra', 'waxtest']

  chains.forEach(chain => {
    limit(() => updater(chain, ['markets', 'prices', 'swap']))
      .catch(e => console.error(`Updater for ${chain} failed:`, e))
  })
}

export async function updater(chain: string, services: string[]) {
  console.log(`[${chain}] Starting updater...`)
  const network = config.networks[chain]

  const command = process.argv[2]
  if (command == 'initial') {
    await swapInitialUpdate(chain)
  }

  // If no setting, create them..
  console.log(`[${chain}] Getting settings...`)
  await getSettings(network)
  console.log(`[${chain}] Settings loaded`)

  // TODO Remove after test
  try {
    console.log(`[${chain}] Updating global stats...`)
    await updateGlobalStats(network, null, 'trace')
    console.log(`[${chain}] Global stats updated`)
  } catch (e) {
    console.log(`[${chain}] GlobalStats err`, e)
  }

  schedule.scheduleJob('58 23 * * *', () => updateGlobalStats(network))

  if (services.includes('prices')) {
    console.log(`[${chain}] Starting price updater...`)
    await Promise.all([updateSystemPrice(network), updateCMSucid()])
    console.log(`[${chain}] Initial prices fetched, updating token prices...`)
    updateTokensPrices(network)
    setInterval(() => updateSystemPrice(network), 5 * 60 * 1000)
    setInterval(() => updateTokensPrices(network), 5 * 60 * 1000)
  }

  if (services.includes('markets')) {
    console.log(`[${chain}] Starting market updater...`)
    await updateMarkets(network)
    console.log(`[${chain}] Markets updated, starting streamer for ${network.contract}...`)
    setInterval(() => updateMarkets(network), 3 * 60 * 1000)

    streamByTrace(network, network.contract, newMatch, config.CONTRACT_ACTIONS)
      .catch(e => { console.log(`[${chain}:${network.contract}] Streamer error:`, e.message); process.exit(1) })
  }

  if (services.includes('swap')) {
    console.log(`[${chain}] Starting swap updater...`)
    await updatePoolsStats(chain)
    await updatePositionsAggregation(chain)
    console.log(`[${chain}] Pool stats updated, starting streamer for ${network.amm.contract}...`)
    setInterval(() => updatePoolsStats(chain), 10 * 60 * 1000)
    setInterval(() => updatePositionsAggregation(chain), 2 * 60 * 1000) // Every 2 minutes

    streamByTrace(network, network.amm.contract, newSwapAction, ['logmint', 'logswap', 'logburn', 'logpool', 'logcollect'], 300)
      .catch(e => { console.log(`[${chain}:${network.amm.contract}] Streamer error:`, e.message); process.exit(1) })
  }

  console.log(`[${chain}] Starting token score updater...`)
  await updateTokenScores(network)
  setInterval(() => updateTokenScores(network), 15 * 60 * 1000)

  console.log(`[${chain}] Starting token holders updater...`)
  startTokenHoldersUpdater(network)
}
