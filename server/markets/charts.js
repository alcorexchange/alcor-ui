import memoize from 'memoizee'
import { Bar, Match } from '../models'

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
  const _resolution = resolutions[resolution]

  if (from && to) {
    from = Math.floor(from / _resolution) * _resolution
    to = Math.ceil(to / _resolution) * _resolution
  }

  const where = { chain, market: parseInt(market) }

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

  const new_bars = []

  for (let i = 0; i < bars.length; i++) {
    const curr = bars[i]
    const next = bars[i + 1]

    if (next) {
      if (curr.close != next.open) {
        curr.close = next.open
      }

      //if (next.open != curr.open) {
      //  curr.close = next.open
      //}
    }

    new_bars.push([curr._id / 1000, curr.Open, curr.High, curr.Low, curr.Close, curr.Volume])
  }

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

export async function pushDeal(io, { chain, market }) {
  const deal = await Match.findOne({ chain, market }, {}, { sort: { time: -1 } }).select('time ask bid type unit_price trx_id')
  io.to(`deals:${chain}.${market}`).emit('new_deals', [deal])
}

export function pushTicker(io, { chain, market, time }) {
  const now = time / 1000

  for (const [resolution, time] of Object.entries(resolutions)) {
    getCharts(chain, market, now - time, now, resolution).then(charts => {
      if (charts.length > 0) {
        io.to(`ticker:${chain}.${market}.${resolution}`).emit('tick', charts[charts.length - 1])
      } else {
        console.log('No charts for emiting after receive!!')
      }
    })
  }
}
