import axios from 'axios'
import axiosRetry from 'axios-retry'
import { JsonRpc } from 'eosjs'
import fetch from 'node-fetch'
import HyperionSocketClient from '@eosrio/hyperion-stream-client'
import { Op } from 'sequelize'

import { Match } from '../models'
import config from '../../config'
import { cache } from '../index'
import { parseAsset, littleEndianToDesimal, parseExtendedAsset } from '../../utils'
import { getVolume, getChange } from './charts'

const ONEDAY = 60 * 60 * 24 * 1000
const WEEK = ONEDAY * 7

axiosRetry(axios, { retries: 3 })

const QUERY_LIMIT = 50

export async function getDeals (network, market_id) {
  const matches = await Match.findAll({ where: { chain: network.name, market: market_id } })

  // TODO Вынести на клиент
  matches.map(m => {
    m.ask = parseAsset(m.ask)
    m.bid = parseAsset(m.bid)
  })

  ///const deals = matches.filter(h => parseInt(h.act.data.record.market.id) == parseInt(market_id))
  ///  .map(m => {
  ///    const data = m.act.data.record

  ///    data.trx_id = m.trx_id
  ///    data.type = m.act.name
  ///    data.ask = parseAsset(data.ask)
  ///    data.bid = parseAsset(data.bid)

  ///    data.time = new Date(m.block_time)

  ///    return data
  ///  })

  return matches
}

export function getMatches(network) {
  const history = cache.get(`${network.name}_history`) || []

  return history.filter(m => ['sellmatch', 'buymatch'].includes(m.act.name))
}

export function updater(chain, interval, hyperion) {
  const network = config.networks[chain]

  console.info(`Start ${chain} updater...`)
  //await new Promise((resolve, reject) => setTimeout(resolve(), 1000)) // Почему то не находит cache без этого

  // First call immidiatelly to fetch available markets
  updateMarkets(network)

  console.log(`fetching ${network.name} initial history..`)
  streamHistory(network, hyperion)

  updateMarkets(network).then(() => {
    setInterval(() => {
      updateMarkets(network)
    }, 60 * 5 * 1000)
  })
}

async function getMarketStats(network, market_id) {
  const stats = {}

  if ('last_price' in stats) return stats

  const last_deal = await Match.findOne({ where: { chain: network.name, market: market_id }, order: [['time', 'DESC']] })
  if (last_deal) {
    stats.last_price = parseInt(last_deal.unit_price)
  } else {
    stats.last_price = 0
  }

  const day_matches = await Match.findAll({ where: { chain: network.name, market: market_id, time: { [Op.gte]: Date.now() - ONEDAY } } })
  const week_matches = await Match.findAll({ where: { chain: network.name, market: market_id, time: { [Op.gte]: Date.now() - WEEK } } })

  stats.volume24 = getVolume(day_matches).toFixed(2)
  stats.volumeWeek = getVolume(week_matches).toFixed(2)

  stats.change24 = getChange(day_matches)
  stats.changeWeek = getChange(week_matches)

  return stats
}

async function updateMarkets(network) {
  const rpc = new JsonRpc(`${network.protocol}://${network.host}:${network.port}`, { fetch })

  const { rows } = await rpc.get_table_rows({
    code: network.contract,
    scope: network.contract,
    table: 'markets',
    reverse: true,
    limit: 1000
  })

  rows.map(r => r.token = r.token = parseExtendedAsset(r.token))

  const requests = rows.map(d => {
    return { market: d, stats: getMarketStats(network, d.id) }
  })

  try {
    await Promise.all(requests.map(r => r.stats))

    const markets = []
    for (const req of requests) {
      const { market } = req
      const stats = await req.stats

      markets.push({ ...market, ...stats })
    }

    cache.set(`${network.name}_markets`, markets, 0)
  } catch (e) {
    rows.map(r => r.last_price = 0)
    cache.set(`${network.name}_markets`, rows, 0)
  }
}

async function getActionsByHyperion(network, account, skip, limit, filter) {
  const formatActionFilter = action => `${account}:${action}`

  const params = { account, skip, limit, filter: filter.map(formatActionFilter).join(','), sort: 'asc' }
  const { data: { actions } } = await axios.get(network.hyperion + 'history/get_actions', { params }, { timeout: 30000 })

  return actions
}

async function getActionsByNode(network, account, _skip, limit, filter) {
  // Здесь мы юзаем свой _skip так как в коде обработки экшена он думает что там будет хайпирион скип
  const rpc = new JsonRpc(`${network.protocol}://${network.host}:${network.port}`, { fetch })

  const actions = []
  let skip = cache.get(`${network.name}_history_by_node_skip`) || 0

  while (true) {
    //console.log('fetch actions from node, skip: ', skip)
    let r
    try {
      r = await rpc.history_get_actions(account, skip, 100)
    } catch (e) {
      console.log('getActionsByNode err: ', e)
      continue
    }

    for (const a of r.actions.map(a => a.action_trace)) {
      if (filter.includes(a.act.name)) {
        actions.push(a)
      }

      skip += 1
      cache.set(`${network.name}_history_by_node_skip`, skip, 0)

      if (actions.length == limit) break
    }

    if (r.actions.length < 100 || actions.length == limit) break
  }

  return actions
}

export function streamHistory(network, hyperion = true) {
  const client = new HyperionSocketClient(network.hyperion, { async: true, fetch })
  client.onConnect = async () => {
    //const last_sell_match = Match.findOne({ order: [['block_num', 'DESC']] }).block_num || 1
    const last_buy_match = await Match.findOne({ where: { type: 'buymatch' }, order: [['block_num', 'DESC']] })
    const last_sell_match = await Match.findOne({ where: { type: 'sellmatch' }, order: [['block_num', 'DESC']] })

    //console.log(last_sell_match.toJSON(), last_buy_match.toJSON())
    //console.log(last_sell_match ? last_sell_match.block_num + 1 : 1, last_buy_match ? last_buy_match.block_num + 1 : 1)

    client.streamActions({
      contract: network.contract,
      action: 'sellmatch',
      account: network.contract,
      start_from: last_sell_match ? last_sell_match.block_num + 1 : 1,
      read_until: 0,
      filters: []
    })

    client.streamActions({
      contract: network.contract,
      action: 'buymatch',
      account: network.contract,
      start_from: last_buy_match ? last_buy_match.block_num + 1 : 1,
      read_until: 0,
      filters: []
    })
  }

  client.onData = async ({ content }, ack) => {
    const { trx_id, block_num, act: { name, data } } = content

    if (['sellmatch', 'buymatch'].includes(name)) {
      // On new match
      const { record: { market, ask, bid, asker, bidder, unit_price } } = data

      const match = await Match.create({
        chain: network.name,
        market: market.id,
        type: name,
        trx_id,

        unit_price,

        ask,
        asker,
        bid,
        bidder,

        time: content['@timestamp'],
        block_num
      })

      //TODO Update call push
      //console.log(match.toJSON())
    }

    ack()
  }

  client.connect(() => {
    console.log(`Start streaming for ${network.name}..`)
  })
}

//export async function loadHistory(network, hyperion = true) {
//  const contract = network.contract
//
//  let skip = cache.get(`${network.name}_history_skip`) || 0
//  const actions = cache.get(`${network.name}_history`) || []
//
//  try {
//    const new_acions = hyperion
//      ? await getActionsByHyperion(network, contract, skip, QUERY_LIMIT, ['buymatch', 'sellmatch'])
//      : await getActionsByNode(network, contract, skip, QUERY_LIMIT, ['buymatch', 'sellmatch'])
//
//    //console.log('got ', new_acions.length, ' new_acions from fetch')
//
//    for (const t of new_acions) {
//      if (!t.block_time) t.block_time = t.timestamp
//
//      const data = t.act.data.record
//      if (data == undefined) {
//        console.log(`data bug in(${network.name}): `, t.trx_id)
//        continue
//      }
//
//      data.trx_id = t.trx_id
//      data.type = t.act.name
//      data.ask = parseAsset(data.ask)
//      data.bid = parseAsset(data.bid)
//      data.unit_price = littleEndianToDesimal(data.unit_price)
//
//      actions.push(t)
//    }
//
//    skip += new_acions.length
//
//    cache.set(`${network.name}_history_skip`, skip, 0)
//    cache.set(`${network.name}_history`, actions, 0)
//
//    if (new_acions.length == QUERY_LIMIT) {
//      // Значит там есть еще, фетчим дальше
//      await loadHistory(network, hyperion)
//    }
//  } catch (e) {
//    console.log(`Update error for: ${network.name}`, e.message, e)
//  }
//}
