import axios from 'axios'
import axiosRetry from 'axios-retry'
import { JsonRpc } from 'eosjs'
import fetch from 'node-fetch'
import HyperionSocketClient from '@eosrio/hyperion-stream-client'

import { Match, getSettings } from '../models'
import config from '../../config'
import { cache } from '../index'
import { parseAsset, littleEndianToDesimal, parseExtendedAsset } from '../../utils'
import { getVolume, getChange, markeBar, pushDeal, pushTicker } from './charts'

const ONEDAY = 60 * 60 * 24 * 1000
const WEEK = ONEDAY * 7

axiosRetry(axios, { retries: 3 })

export function getMatches(network) {
  const history = cache.get(`${network.name}_history`) || []

  return history.filter(m => ['sellmatch', 'buymatch'].includes(m.act.name))
}

export function updater(chain, app, hyperion = true) {
  const network = config.networks[chain]

  console.info(`Start ${chain} updater...`)

  // First call immidiatelly to fetch available markets
  updateMarkets(network)

  if (hyperion) {
    streamHistory(network, app)
  } else {
    //streamByDfuse(network, app)
    streamByNode(network, app)
  }

  updateMarkets(network).then(() => {
    setInterval(() => {
      updateMarkets(network)
    }, 5 * 60 * 1000)
  })
}

export async function getMarketStats(network, market_id) {
  const stats = {}

  if ('last_price' in stats) return stats

  const last_deal = await Match.findOne({ chain: network.name, market: market_id }, {}, { sort: { time: -1 } })
  if (last_deal) {
    stats.last_price = parseFloat(last_deal.unit_price)
  } else {
    stats.last_price = 0
  }

  const day_matches = await Match.find({ chain: network.name, market: market_id, time: { $gte: Date.now() - ONEDAY } })
  const week_matches = await Match.find({ chain: network.name, market: market_id, time: { $gte: Date.now() - WEEK } })

  stats.volume24 = getVolume(day_matches)
  stats.volumeWeek = getVolume(week_matches)

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

  rows.map(r => {
    r.base_token = parseExtendedAsset(r.base_token)
    r.quote_token = parseExtendedAsset(r.quote_token)
  })

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

async function streamByNode(network, app) {
  // Здесь мы юзаем свой _skip так как в коде обработки экшена он думает что там будет хайпирион скип
  const rpc = new JsonRpc(`${network.protocol}://${network.host}:${network.port}`, { fetch })
  const settings = await getSettings(network)
  const filter = config.CONTRACT_ACTIONS

  console.log('start fetching actions by node from', settings.actions_stream_offset, 'for ', network.name)
  while (true) {
    let r
    try {
      r = await rpc.history_get_actions(network.contract, settings.actions_stream_offset, 100)
    } catch (e) {
      console.log('getActionsByNode err: ', e.message)
      await new Promise((resolve, reject) => setTimeout(resolve, 2000))
      continue
    }

    for (const a of r.actions.map(a => a.action_trace)) {
      if (filter.includes(a.act.name)) {
        await newMatch(a, network, app)
      }

      settings.actions_stream_offset += 1
      await settings.save()
    }

    if (r.actions.length < 100) {
      await new Promise((resolve, reject) => setTimeout(resolve, 2000))
    }
  }
}

export function streamHistory(network, app) {
  const client = new HyperionSocketClient(network.hyperion, { async: true, fetch })
  client.onConnect = async () => {
    const last_buy_match = await Match.findOne({ chain: network.name, type: 'buymatch' }, {}, { sort: { block_num: -1 } })
    const last_sell_match = await Match.findOne({ chain: network.name, type: 'sellmatch' }, {}, { sort: { block_num: -1 } })

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

    // Other actions
    client.streamActions({ contract: network.contract, action: 'sellreceipt', account: network.contract })
    client.streamActions({ contract: network.contract, action: 'buyreceipt', account: network.contract })
    client.streamActions({ contract: network.contract, action: 'cancelsell', account: network.contract })
    client.streamActions({ contract: network.contract, action: 'cancelbuy', account: network.contract })
  }

  client.onData = async ({ content }, ack) => {
    await newMatch(content, network, app)
    ack()
  }

  client.connect(() => {
    console.log(`Start streaming for ${network.name}..`)
  })
}

async function newMatch(match, network, app) {
  const { trx_id, block_num, act: { name, data } } = match

  const io = app.get('io')
  const chain = network.name

  if (['sellmatch', 'buymatch'].includes(name)) {
    // On new match
    const { record: { market, ask, bid, asker, bidder, unit_price } } = 'data' in data ? data.data : data
    console.log('new match', network.name, '@timestamp' in match ? match['@timestamp'] : match.block_time, 'market', market.id)

    try {
      const m = await Match.create({
        chain: network.name,
        market: parseInt(market.id),
        type: name,
        trx_id,

        unit_price: littleEndianToDesimal(unit_price) / config.PRICE_SCALE,

        ask: parseAsset(ask).prefix,
        asker,
        bid: parseAsset(bid).prefix,
        bidder,

        time: '@timestamp' in match ? match['@timestamp'] : match.block_time,
        block_num
      })
      pushDeal(io, { chain, market: market.id })

      await markeBar(m)
      pushTicker(io, { chain, market: market.id, time: m.time })
      io.to(`orders:${network.name}.${market.id}`).emit('update_orders')
    } catch (e) {
      console.log('handle match err..', e, 'retrying...')
      await new Promise(resolve => setTimeout(resolve, 1000))
      return await newMatch(match, network, app)
    }
  } else if (['buyreceipt', 'sellreceipt', 'cancelsell', 'cancelbuy'].includes(name)) {
    const { market_id } = 'data' in data ? data.data : data
    if (!market_id) return

    io.to(`orders:${network.name}.${market_id}`).emit('update_orders')
  }
}
