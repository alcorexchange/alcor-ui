import config from '../../config'

import { getSettings } from '../models'
import { newPoolsAction } from '../pools'
import { updateMarkets, newMatch } from './markets'

import { streamHyperion, streamByNode } from './streamers'

const providers = {
  hyperion: streamHyperion,
  node: streamByNode
}

export function startUpdaters() {
  if (process.env.NETWORK) {
    //updater('wax', app, 'node', ['markets', 'pools'])
    //updater(process.env.NETWORK, 'node', ['pools', 'markets'])
    updater(process.env.NETWORK, 'node', ['markets'])
    //updater(process.env.NETWORK, app, 'node', ['pools'])
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

  if (services.includes('markets')) {
    console.log('Start market updater for', chain)

    await updateMarkets(network)
    setInterval(() => updateMarkets(network), 1 * 60 * 1000)

    while (true) {
      try {
        await streamer(network, network.contract, newMatch, config.CONTRACT_ACTIONS)
      } catch (e) {
        console.error(`${chain} STREAMER WAS FAILED! restarting...`, e)
        await new Promise((resolve, reject) => setTimeout(resolve, 1000))
      }
    }
  }

  if (services.includes('pools')) {
    console.log('start pools updater for', chain)
    streamer(network, network.pools.contract, newPoolsAction, ['exchangelog', 'liquiditylog', 'transfer'])
  }
}
