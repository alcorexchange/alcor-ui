const resolutions = {
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

export function getCharts(history, market, { resolution, from, to }) {
  if (from) from = parseInt(from)
  if (to) to = parseInt(to)

  const actions = history.filter(a => {
    const action_name = a.act.name

    if (['sellmatch', 'buymatch'].includes(action_name)) {
      return parseInt(a.act.data.record.market.id) == parseInt(market.id)
    } else return false
  }).map(a => {
    a.act.timestamp = a.block_time

    return a.act
  })

  const prices = actions.map(a => {
    const record = a.data.record
    return {
      price: parseInt(record.unit_price) / 100000000,
      time: Date.parse(a.timestamp) / 1000,
      volume: record.type == 'buymatch' ? parseFloat(record.bid.prefix) : parseFloat(record.ask.prefix)
    }
  })

  let results = []
  if (prices.length > 0 && resolution) {
    let current_time = prices[0].time

    while (true) {
      const nex_time = current_time + resolutions[resolution]
      const values = prices.filter(p => p.time >= current_time && p.time < nex_time)

      if (values.length == 0) {
        const last_item = results[results.length - 1] || { close: 0 }

        results.push({
          time: current_time,
          open: last_item.close,
          high: last_item.close,
          low: last_item.close,
          close: last_item.close,
          volume: 0
        })
      } else {
        results.push({
          time: current_time,
          open: values[0].price,
          high: Math.max(...values.map(v => v.price)),
          low: Math.min(...values.map(v => v.price)),
          close: values[values.length - 1].price,
          volume: values.map(v => v.volume).reduce((a, b) => a + b, 0)
        })
      }

      if (current_time > Date.now() / 1000) break

      current_time = nex_time
    }
  }

  if (from && to) {
    // Filter by time
    results = results.filter(p => {
      return p.time >= from && p.time <= to
    })

    if (results.length > 0) {
      results[results.length - 1].time = to
    }
  }

  for (let i = 0; i < results.length; i++) {
    const curr = results[i]
    const next = results[i + 1]

    if (!next) {
      break
    }

    if (curr.close != next.open) {
      curr.close = next.open
    }
  }

  return results
}

export function getVolume(deals, period) {
  let volume = 0

  deals.filter(h => {
    return Date.now() - period < h.time.getTime()
  }).map(m => {
    m.type == 'buymatch' ? volume += m.bid.amount : volume += m.ask.amount
  })

  return volume
}

export function getChange(deals, period) {
  deals = deals.filter(h => Date.now() - period < h.time.getTime())

  if (deals.length > 0) {
    const price_before = parseInt(deals[deals.length - 1].unit_price)
    const price_after = parseInt(deals[0].unit_price)

    const change = ((price_after - price_before) / price_before) * 100

    return change
  } else {
    return 0
  }
}
