import { Bar, Match } from '../../models'

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

export async function markeBars(match) {
  const dbOperations = []

  Object.keys(resolutions).map(timeframe => {
    dbOperations.push(markeBar(timeframe, match))
  })

  await Promise.all(dbOperations)
}

export async function markeBar(timeframe, match) {
  const last_bar = await Bar.findOne({ chain: match.chain, market: match.market, timeframe }, {}, { sort: { time: -1 } })

  if (!last_bar) {
    //console.log('create first bar for market:', match.market, 'for timeframe:', timeframe)
    await Bar.create({
      timeframe,
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

  const resolution = resolutions[timeframe]

  const start_time = last_bar.time.getTime();
  let end_time = start_time + resolution * 1000

  if (match.time.getTime() < end_time) {
    // Match in the same timeframe as the last bar
    if (last_bar.high < match.unit_price) {
      last_bar.high = match.unit_price
    } else if (last_bar.low > match.unit_price) {
      last_bar.low = match.unit_price
    }
    last_bar.close = match.unit_price
    last_bar.volume += match.type == 'buymatch' ? match.bid : match.ask
    await last_bar.save()
  } else {
    const time_diff = match.time.getTime() - endTime;
    const intervals_to_add = Math.ceil(time_diff / (resolution * 1000));
    end_time += intervals_to_add * resolution * 1000;    
    // Create a new bar for the new timeframe
    await Bar.create({
      timeframe,
      chain: match.chain,
      market: match.market,
      time: new Date(end_time),
      open: last_bar.close,
      high: match.unit_price,
      low: match.unit_price,
      close: match.unit_price,
      volume: match.type == 'buymatch' ? match.bid : match.ask
    })
    last_bar.close = match.unit_price
    await last_bar.save()    
  }
}

export async function getVolumeFrom(date, market, chain) {
  const day_volume = await Match.aggregate([
    { $match: { chain, market, time: { $gte: new Date(date) } } },
    { $project: { market: 1, value: { $cond: { if: { $eq: ['$type', 'buymatch'] }, then: '$bid', else: '$ask' } } } },
    { $group: { _id: '$market', volume: { $sum: '$value' } } }
  ])

  return day_volume.length == 1 ? day_volume[0].volume : 0
}

export async function getChangeFrom(date, market, chain) {
  const date_deal = await Match.findOne({ chain, market, time: { $gte: new Date(date) } }, {}, { sort: { time: 1 } })
  const last_deal = await Match.findOne({ chain, market }, {}, { sort: { time: -1 } })

  if (date_deal) {
    const price_before = date_deal.unit_price
    const price_after = last_deal.unit_price

    return ((price_after - price_before) / price_before) * 100
  } else {
    return 0
  }
}
