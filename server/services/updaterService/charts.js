import { SwapBar, Bar, Match } from '../../models'

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

function getBarTimes(matchTime, resolutionInSeconds) {
  const resolutionMilliseconds = resolutionInSeconds * 1000 // Преобразование секунд в миллисекунды
  const matchTimeMilliseconds = matchTime.getTime() // Получаем время сделки в миллисекундах
  const barStartTime = Math.floor(matchTimeMilliseconds / resolutionMilliseconds) * resolutionMilliseconds
  const nextBarStartTime = barStartTime + resolutionMilliseconds // Добавляем один интервал к началу текущего бара

  return {
    currentBarStart: new Date(barStartTime), // Возвращаем объект Date для текущего бара
    nextBarStart: new Date(nextBarStartTime), // Возвращаем объект Date для следующего бара
  }
}

export async function makeSpotBars(match) {
  const timeframes = Object.keys(resolutions)
  const promises = timeframes.map((timeframe) => makeSpotBar(timeframe, match))

  await Promise.all(promises)
}

export async function makeSpotBar(timeframe, match) {
  const frame = resolutions[timeframe]
  const { currentBarStart, nextBarStart } = getBarTimes(match.time, frame)

  const bar = await Bar.findOne({
    chain: match.chain,
    market: match.market,
    timeframe,
    time: {
      $gte: currentBarStart,
      $lt: nextBarStart
    }
  })

  if (!bar) {
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
  } else {
    if (bar.high < match.unit_price) {
      bar.high = match.unit_price
    } else if (bar.low > match.unit_price) {
      bar.low = match.unit_price
    }

    bar.close = match.unit_price
    bar.volume += match.type == 'buymatch' ? match.bid : match.ask

    await bar.save()
  }
}

export async function makeSwapBars(swap) {
  const timeframes = Object.keys(resolutions)
  const promises = timeframes.map((timeframe) => makeSwapBar(timeframe, swap))

  await Promise.all(promises)
}

export async function makeSwapBar(timeframe, swap) {
  const frame = resolutions[timeframe]
  const { currentBarStart, nextBarStart } = getBarTimes(swap.time, frame)

  const bar = await SwapBar.findOne({
    chain: swap.chain,
    pool: swap.pool,
    timeframe,
    time: {
      $gte: currentBarStart,
      $lt: nextBarStart
    }
  })

  if (!bar) {
    await SwapBar.create({
      timeframe,
      chain: swap.chain,
      pool: swap.pool,
      time: currentBarStart,
      open: swap.sqrtPriceX64,
      high: swap.sqrtPriceX64,
      low: swap.sqrtPriceX64,
      close: swap.sqrtPriceX64,

      volumeA: Math.abs(swap.tokenA),
      volumeB: Math.abs(swap.tokenB),
      volumeUSD: swap.totalUSDVolume,
    })
  } else {
    if (BigInt(bar.high) < BigInt(swap.sqrtPriceX64)) {
      bar.high = swap.sqrtPriceX64
    } else if (BigInt(bar.low) > BigInt(swap.sqrtPriceX64)) {
      bar.low = swap.sqrtPriceX64
    }

    bar.close = swap.sqrtPriceX64

    bar.volumeA += Math.abs(swap.tokenA)
    bar.volumeB += Math.abs(swap.tokenB)
    bar.volumeUSD += swap.totalUSDVolume
    await bar.save()
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
