import config from '../../config'

import { getSettings } from '../models'
import { newPoolsAction } from '../pools'
import { updateMarkets, newMatch } from '../markets/history'

import { streamHyperion, streamByNode } from './streamers'

const providers = {
  hyperion: streamHyperion,
  node: streamByNode
}

export function startUpdaters(app) {
  if (process.env.NETWORK) {
    //updater('wax', app, 'node', ['markets', 'pools'])
    updater(process.env.NETWORK, app, 'node', ['pools', 'markets'])
  } else {
    updater('eos', app, 'node', ['markets', 'pools'])
    updater('wax', app, 'node', ['markets', 'pools'])
    updater('proton', app, 'node', ['markets'])
    updater('telos', app, 'node', ['markets'])
    // updater('telos', app, 'hyperion', ['markets'])
    //updater('bos', app, false) // Update by node, not hyperion
  }
}

export async function updater(chain, app, provider, services) {
  const network = config.networks[chain]
  const streamer = providers[provider]

  // If no setting, create them..
  await getSettings(network)

  if (services.includes('markets')) {
    setTimeout(() => updateMarkets(network), 5000)
    setInterval(() => updateMarkets(network), 5 * 60 * 1000)

    streamer(network, app, network.contract, newMatch, config.CONTRACT_ACTIONS)
  }

  if (services.includes('pools')) {
    console.log('start pools updater for', chain)
    streamer(network, app, network.pools.contract, newPoolsAction, ['exchangelog', 'liquiditylog'])
  }
}
