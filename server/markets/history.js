import axios from 'axios'
import axiosRetry from 'axios-retry'

import config from '../../config'
import { cache } from '../index'
const { parseAsset } = require('../../utils')

axiosRetry(axios, { retries: 3 })

const QUERY_LIMIT = 50

export function getDeals (network, market_id) {
  const matches = getMatches(network)

  const deals = matches.filter(h => parseInt(h.act.data.record.market.id) == parseInt(market_id))
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

  return deals.reverse()
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
  const filter = ['buymatch', 'sellmatch'].map(formatActionFilter).join(',')

  let skip = cache.get(`${network.name}_history_skip`) || 0
  const actions = cache.get(`${network.name}_history`) || []

  try {
    const r = await hyperion.get('history/get_actions', {
      params: {
        account: contract,
        skip,
        limit: QUERY_LIMIT,
        filter,
        sort: 'asc'
      }
    })

    r.data.actions.map(m => {
      const data = m.act.data.record

      data.trx_id = m.trx_id
      data.type = m.act.name
      data.ask = parseAsset(data.ask)
      data.bid = parseAsset(data.bid)

      // FIXME Fix afret fix contract timestamp
      data.time = new Date(m['@timestamp'])

      return data
    })

    actions.push(...r.data.actions)
    skip += r.data.actions.length

    cache.set(`${network.name}_history_skip`, skip, 0)
    cache.set(`${network.name}_history`, actions, 0)

    if (r.data.actions.length == QUERY_LIMIT) {
      // Значит там есть еще, фетчим дальше
      await loadHistory(network)
    }
  } catch (e) {
    console.log(`Update error for: ${network.name}`, e.message)
  }
}
