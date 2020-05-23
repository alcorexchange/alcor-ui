import axios from 'axios'
import axiosRetry from 'axios-retry'

import config from '../../config'
import { cache } from '../index'
const { parseAsset } = require('../../utils')

axiosRetry(axios, { retries: 3 })

export function getDeals (network, market_id) {
  const matches = getMatches(network)

  return matches.filter(h => parseInt(h.act.data.record.market.id) == parseInt(market_id))
    .map(m => {
      const data = m.act.data.record

      data.trx_id = m.trx_id
      data.type = m.act.name
      data.ask = parseAsset(data.ask)
      data.bid = parseAsset(data.bid)

      // FIXME Fix afret fix contract timestamp
      data.time = new Date(m['@timestamp'])

      return data
    })
}

export function getMatches(network) {
  const history = cache.get(`${network.name}_history`) || []

  return history.filter(m => ['sellmatch', 'buymatch'].includes(m.act.name))
}

export function updater(chain, interval) {
  const network = config.networks[chain]

  console.info(`Start ${chain} updater...`)
  setInterval(() => {
    loadHistory(network)
  }, interval)
}

export async function loadHistory(network) {
  const hyperion = axios.create({
    baseURL: network.hyperion,
    timeout: 30 * 1000
  })

  const contract = network.contract
  const formatActionFilter = action => `${contract}:${action}`
  const filter = config.CONTRACT_ACTIONS.map(formatActionFilter).join(',')

  const actions = []

  try {
    const r = await hyperion.get('history/get_actions', {
      params: {
        account: contract,
        limit: 1000,
        filter
      }
    })

    actions.push(...r.data.actions)

    if (r.data.total.value > 1000) {
      const times = Math.ceil(r.data.total.value / 1000) - 1
      let offset = 1000

      const requests = []

      for (let i = 0; i < times; i++) {
        requests.push(
          hyperion.get('history/get_actions', {
            params: {
              account: network.contract,
              skip: offset,
              filter,
              limit: 1000
            }
          })
        )
        offset += 1000
      }

      await Promise.all(requests).then(data => {
        data.map(d => actions.push(...d.data.actions))
      })
    }
  } catch (e) {
    console.log(`Update error for: ${network.name}`, e.message)
    return
  }

  actions.filter(m => ['sellmatch', 'buymatch'].includes(m.act.name)).map(m => {
    const data = m.act.data.record

    data.trx_id = m.trx_id
    data.type = m.act.name
    data.ask = parseAsset(data.ask)
    data.bid = parseAsset(data.bid)

    // FIXME Fix afret fix contract timestamp
    data.time = new Date(m['@timestamp'])

    return data
  })

  cache.set(`${network.name}_history`, actions, 30 * 1)

  return actions
}
