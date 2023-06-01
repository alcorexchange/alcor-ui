import schedule from 'node-schedule'

import config from '../../../config'

import { getSettings } from '../../utils'
import { updatePools } from '../swapV2Service'
import { updateGlobalStats } from './analytics'
import { newPoolsAction } from './pools'
import { updateMarkets, newMatch } from './markets'
import { newSwapAction, updatePoolsStats } from './swap'
import { updateSystemPrice, updateTokensPrices } from './prices'

import { streamHyperion, streamByNode } from './streamers'

const providers = {
  hyperion: streamHyperion,
  node: streamByNode
}

export function startUpdaters() {
  if (process.env.NETWORK) {
    console.log('NETWORK=', process.env.NETWORK)
    updater(process.env.NETWORK, 'node', ['swap'])
  } else {
    updater('eos', 'node', ['markets', 'pools', 'prices', 'swap'])
    updater('wax', 'node', ['markets', 'pools', 'prices', 'swap'])
    updater('proton', 'node', ['markets', 'prices', 'swap'])
    updater('telos', 'node', ['markets', 'pools', 'prices', 'swap'])
  }
}

export async function updater(chain, provider, services) {
  console.log('run updater for', chain)
  const network = config.networks[chain]
  const streamer = providers[provider]


  // If no setting, create them..
  await getSettings(network)

  // TODO Fetch for last 30 days
  // Global stats every our
  //await updateGlobalStats(network)
  //setInterval(() => updateGlobalStats(network), 60 * 60 * 4 * 1000)
  //schedule.scheduleJob('0 0 * * *', updateGlobalStats(network)) // run everyday at midnight
  //return

  if (services.includes('prices')) {
    console.log('Start price updater for', chain)

    await updateSystemPrice(network)
    updateTokensPrices(network)

    setInterval(() => updateSystemPrice(network), 1 * 60 * 1000)
    setInterval(() => updateTokensPrices(network), 1 * 60 * 1000)
  }

  if (services.includes('markets')) {
    console.log('Start market updater for', chain)

    await updateMarkets(network)
    setInterval(() => updateMarkets(network), 1 * 60 * 1000)

    streamer(network, network.contract, newMatch, config.CONTRACT_ACTIONS)
      // Production PM2 should restart updater after it
      .catch(e => { console.log(`${network.name} (${network.contract}) Updater Error!`, e); process.exit(1) })
  }

  if (services.includes('pools')) {
    console.log('start pools updater for', chain)
    streamer(network, network.pools.contract, newPoolsAction, ['exchangelog', 'liquiditylog', 'transfer'])
      .catch(e => { console.log(`${network.name} (${network.pools.contract}) Updater Error!`, e); process.exit(1) })
  }

  if (services.includes('swap')) {
    console.log('start swap updater for', chain)

    //await updatePools(chain)
    await updatePoolsStats(chain)
    setInterval(() => updatePoolsStats(chain), 1 * 60 * 1000)

    streamer(network, network.amm.contract, newSwapAction, ['logmint', 'logswap', 'logburn', 'logpool', 'logcollect'])
      .catch(e => { console.log(`${network.name} (${network.amm.contract}) Updater Error!`, e); process.exit(1) })
  }
}
