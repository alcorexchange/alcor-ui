function formatDate(d) {
  let month = '' + (d.getMonth() + 1),
    day = '' + d.getDate()
  const year = d.getFullYear()

  if (month.length < 2)
    month = '0' + month
  if (day.length < 2)
    day = '0' + day

  return [year, month, day].join('-')
}

export function dayChart(actions) {
  const result = []

  for (const act of actions.map(a => {
    a.act.timestamp = new Date(a['@timestamp'])

    return a.act
  }).reverse()) {
    const record = act.data.record
    result.push({ price: record.unit_price, time: act.timestamp })
  }

  const results = []
  const new_result = {}

  if (result.length > 0) {
    const current_time = new Date(result[0].time)

    while (true) {
      new_result[formatDate(current_time)] = result.filter(p => {
        return p.time.getDate() == current_time.getDate() &&
          p.time.getMonth() == current_time.getMonth() &&
          p.time.getFullYear() == current_time.getFullYear()
      })

      if (current_time > new Date()) {
        break
      }

      current_time.setDate(current_time.getDate() + 1)
    }
  }

  for (const [key, values] of Object.entries(new_result)) {
    if (values.length == 0) {
      const last_item = results[results.length - 1]

      results.push({
        time: key,
        open: last_item.close,
        high: last_item.close,
        low: last_item.close,
        close: last_item.close,
        volume: 0
      })

      continue
    }

    results.push({
      time: key,
      open: values[0].price,
      high: Math.max(...values.map(v => v.price)),
      low: Math.min(...values.map(v => v.price)),
      close: values[values.length - 1].price,
      volume: 0
    })
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
    m.type == 'buymatch' ? volume += parseFloat(m.bid.quantity) : volume += parseFloat(m.ask.quantity)
  })

  return volume
}
