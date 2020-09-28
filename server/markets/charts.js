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

export function makeCharts(matches, resolution) {
  const prices = matches.map(m => {
    return {
      price: parseInt(m.unit_price) / 100000000,
      time: m.time.getTime() / 1000,
      volume: m.type == 'buymatch' ? parseFloat(m.bid) : parseFloat(m.ask)
    }
  })

  const results = []
  if (prices.length > 0 && resolution) {
    const first = new Date(prices[0].time * 1000)
    first.setHours(0, 0, 0, 0)

    let current_time = first.getTime() / 1000

    while (true) {
      const nex_time = current_time + resolutions[resolution]
      const values = prices.filter(p => p.time >= current_time && p.time < nex_time)

      if (values.length == 0) {
        const last_item = results[results.length - 1] || { close: 0 }

        results.push({
          time: nex_time,
          open: last_item.close,
          high: last_item.close,
          low: last_item.close,
          close: last_item.close,
          volume: 0
        })
      } else {
        results.push({
          time: nex_time,
          open: values[0].price,
          high: Math.max(...values.map(v => v.price)),
          low: Math.min(...values.map(v => v.price)),
          close: values[values.length - 1].price,
          volume: values.map(v => v.volume).reduce((a, b) => a + b, 0)
        })
      }

      if (nex_time > Date.now() / 1000) break

      current_time = nex_time
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

export function getVolume(deals) {
  let volume = 0

  deals.map(m => {
    m.type == 'buymatch' ? volume += parseFloat(m.bid) : volume += parseFloat(m.ask)
  })

  return volume
}

export function getChange(deals) {
  if (deals.length > 0) {
    const price_before = parseInt(deals[deals.length - 1].unit_price)
    const price_after = parseInt(deals[0].unit_price)

    const change = ((price_after - price_before) / price_before) * 100

    return change
  } else {
    return 0
  }
}
