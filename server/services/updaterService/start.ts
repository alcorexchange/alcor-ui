import schedule from 'node-schedule'

import config from '../../../config'
import { initialUpdate as swapInitialUpdate } from '../swapV2Service'

import { getSettings } from '../../utils'
import { updateGlobalStats } from './analytics'
import { updateMarkets, newMatch } from './markets'
import { newSwapAction, updatePoolsStats } from './swap'
import { updateCMSucid, updateSystemPrice, updateTokensPrices } from './prices'

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
  console.log('run updater for', chain)
  const network = config.networks[chain]

  const command = process.argv[2]
  if (command == 'initial') {
    await swapInitialUpdate(chain)
  }

  // If no setting, create them..
  await getSettings(network)

  // TODO Remove after test
  try {
    await updateGlobalStats(network, null, 'trace')
  } catch (e) {
    console.log('GlobalStats err', e)
  }

  schedule.scheduleJob('58 23 * * *', () => updateGlobalStats(network))

  if (services.includes('prices')) {
    console.log('Start price updater for', chain)

    await Promise.all([updateSystemPrice(network), updateCMSucid()])

    updateTokensPrices(network)

    setInterval(() => updateSystemPrice(network), 5 * 60 * 1000)
    setInterval(() => updateTokensPrices(network), 5 * 60 * 1000)
  }

  if (services.includes('markets')) {
    console.log('Start market updater for', chain)

    console.time('update markets for ' + network.name)
    await updateMarkets(network)
    console.timeEnd('update markets for ' + network.name)

    setInterval(() => updateMarkets(network), 3 * 60 * 1000)

    // Use trace-based streaming with automatic Greymass fallback
    streamByTrace(network, network.contract, newMatch, config.CONTRACT_ACTIONS)
      .catch(e => { console.log(`${network.name} (${network.contract}) Updater Error!`, e); process.exit(1) })
  }

  if (services.includes('swap')) {
    console.log('start swap updater for', chain)

    await updatePoolsStats(chain)
    setInterval(() => updatePoolsStats(chain), 10 * 60 * 1000)

    // Use trace-based streaming with automatic Greymass fallback
    streamByTrace(network, network.amm.contract, newSwapAction, ['logmint', 'logswap', 'logburn', 'logpool', 'logcollect'], 300)
      .catch(e => { console.log(`${network.name} (${network.amm.contract}) Updater Error!`, e); process.exit(1) })
  }
}
