import memoize from 'memoizee'
import { Bar } from '../models'

export const resolutions = {
  1: 1 * 60,
  5: 5 * 60,
  15: 15 * 60,
  30: 30 * 60,
  60: 60 * 60,
  240: 60 * 60 * 4,
  '1D': 60 * 60 * 24,
  '1W': 60 * 60 * 24 * 7,
  '1M': 60 * 60 * 24 * 30
}

export const getCharts = memoize(async function (chain, market, from, to, resolution) {
  const where = { chain, market }

  if (from && to) {
    where.time = {
      $gte: new Date(parseFloat(from) * 1000),
      $lte: new Date(parseFloat(to) * 1000)
    }
  }

  const bars = await Bar.aggregate([
    { $match: where },
    {
      $group:
      {
        _id: {
          $toDate: {
            $subtract: [
              { $toLong: '$time' },
              { $mod: [{ $toLong: '$time' }, resolutions[resolution] * 1000] }
            ]
          }
        },
        Open: { $first: '$open' },
        High: { $max: '$high' },
        Low: { $min: '$low' },
        Close: { $last: '$close' },
        Volume: { $sum: '$volume' }
      }
    },
    { $sort: { _id: 1 } }
  ]).allowDiskUse(true)

  const new_bars = bars.map(b => [b._id / 1000, b.Open, b.High, b.Low, b.Close, b.Volume])
  return new_bars
}, { maxAge: 60 * 1 * 1000, primitive: true })


export async function markeBar(match) {
  const last_bar = await Bar.findOne({ chain: match.chain, market: match.market }, {}, { sort: { time: -1 } })

  if (!last_bar) {
    // Нет баров это будет первый
    await Bar.create({
      chain: match.chain,
      market: match.market,
      time: match.time,
      open: match.unit_price,
      high: match.unit_price,
      low: match.unit_price,
      close: match.unit_price,
      volume: match.type == 'buymatch' ? match.bid : match.ask
    })

    return
  }

  if (Math.floor(last_bar.time / 1000 / 60) == Math.floor(match.time / 1000 / 60)) {
    console.log('match in same minute..')
    // match in same minute
    if (last_bar.high < match.unit_price) {
      last_bar.high = match.unit_price
    } else if (last_bar.low > match.unit_price) {
      last_bar.low = match.unit_price
    }

    last_bar.volume += match.type == 'buymatch' ? match.bid : match.ask
  } else {
    await Bar.create({
      chain: match.chain,
      market: match.market,
      time: match.time,
      open: match.unit_price,
      high: match.unit_price,
      low: match.unit_price,
      close: match.unit_price,
      volume: match.type == 'buymatch' ? match.bid : match.ask
    })
  }

  last_bar.close = match.unit_price
  last_bar.save()
}

// TODO Ненужный функция уже 
//export const makeCharts = memoize((matches, resolution) => {
//  const prices = matches.map(m => {
//    return {
//      price: parseInt(m.unit_price) / 100000000,
//      time: m.time.getTime() / 1000,
//      volume: m.type == 'buymatch' ? parseFloat(m.bid) : parseFloat(m.ask)
//    }
//  })
//
//  const results = []
//  if (prices.length > 0 && resolution) {
//    const first = new Date(prices[0].time * 1000)
//    first.setHours(0, 0, 0, 0)
//
//    let current_time = first.getTime() / 1000
//
//    while (true) {
//      const nex_time = current_time + resolutions[resolution]
//      const values = prices.filter(p => p.time >= current_time && p.time < nex_time)
//
//      if (values.length == 0) {
//        const last_item = results[results.length - 1] || { close: 0 }
//
//        results.push({
//          time: nex_time,
//          open: last_item.close,
//          high: last_item.close,
//          low: last_item.close,
//          close: last_item.close,
//          volume: 0
//        })
//      } else {
//        results.push({
//          time: nex_time,
//          open: values[0].price,
//          high: Math.max(...values.map(v => v.price)),
//          low: Math.min(...values.map(v => v.price)),
//          close: values[values.length - 1].price,
//          volume: values.map(v => v.volume).reduce((a, b) => a + b, 0)
//        })
//      }
//
//      if (nex_time > Date.now() / 1000) break
//
//      current_time = nex_time
//    }
//  }
//
//  for (let i = 0; i < results.length; i++) {
//    const curr = results[i]
//    const next = results[i + 1]
//
//    if (!next) {
//      break
//    }
//
//    if (curr.close != next.open) {
//      curr.close = next.open
//    }
//  }
//
//  return results
//}, { maxAge: 60 * 60 * 24 })

export const getVolume = deals => {
  let volume = 0

  deals.map(m => {
    m.type == 'buymatch' ? volume += parseFloat(m.bid) : volume += parseFloat(m.ask)
  })

  return volume
}

export const getChange = (deals) => {
  if (deals.length > 0) {
    const price_before = parseFloat(deals[deals.length - 1].unit_price)
    const price_after = parseFloat(deals[0].unit_price)

    const change = ((price_after - price_before) / price_before) * 100

    return change
  } else {
    return 0
  }
}
