import config from '../../../config'

import { getSettings } from '../../utils'
import { newPoolsAction } from './pools'
import { updateMarkets, newMatch } from './markets'
import { newSwapAction } from './swap'
import { updateSystemPrice } from './systemPrices'

import { streamHyperion, streamByNode } from './streamers'

const providers = {
  hyperion: streamHyperion,
  node: streamByNode
}

export function startUpdaters() {
  if (process.env.NETWORK) {
    //updater(process.env.NETWORK, 'node', ['systemPrices', 'swap'])
    updater(process.env.NETWORK, 'node', ['systemPrices'])
  } else {
    updater('eos', 'node', ['markets', 'pools'])
    updater('wax', 'node', ['markets', 'pools'])
    updater('proton', 'node', ['markets'])
    updater('telos', 'node', ['markets', 'pools'])
  }
}

export async function updater(chain, provider, services) {
  const network = config.networks[chain]
  const streamer = providers[provider]

  // If no setting, create them..
  await getSettings(network)


  if (services.includes('systemPrices')) {
    console.log('Start systemPrice updater for', chain)

    await updateSystemPrice(network)
    setInterval(() => updateSystemPrice(network), 1 * 60 * 1000)
  }

  if (services.includes('markets')) {
    console.log('Start market updater for', chain)

    await updateMarkets(network)
    setInterval(() => updateMarkets(network), 1 * 60 * 1000)

    streamer(network, network.contract, newMatch, config.CONTRACT_ACTIONS)
      // Production PM2 should restart updater after it
      .catch(e => { console.log(`${network.name} (${network.contract}) Updater Error!`); process.exit(1) })
  }

  if (services.includes('pools')) {
    console.log('start pools updater for', chain)
    streamer(network, network.pools.contract, newPoolsAction, ['exchangelog', 'liquiditylog', 'transfer'])
      .catch(e => { console.log(`${network.name} (${network.pools.contract}) Updater Error!`); process.exit(1) })
  }

  if (services.includes('swap')) {
    console.log('start swap updater for', chain)
    streamer(network, network.amm.contract, newSwapAction, ['logmint', 'logswap', 'logburn', 'logpool'])
      .catch(e => { console.log(`${network.name} (${network.amm.contract}) Updater Error!`); process.exit(1) })
  }
}
