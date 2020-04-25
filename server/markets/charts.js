import taffy from 'taffy'
import { quantityToAmount } from '../../utils'

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

function save_price_history(list, db, time) {
  if (db().count() > 0) {
    const price = parseInt(db().order('price').last().price)

    list.push({ price, time })
  } else {
    //console.log('no orders for history')
  }
}

export function dayChart(actions) {
  const result = []
  const buyOrders = taffy()
  const sellOrders = taffy()

  for (const act of actions.map(a => {
    a.act.timestamp = new Date(a['@timestamp'])
    a.act.block_num = a.block_num // FIXME Remove

    return a.act
  }).reverse()) {
    const data = act.data

    if (act.name == 'cancelbuy') {
      buyOrders({ account: data.executor, order_id: parseInt(data.order_id) }).remove()

      save_price_history(result, buyOrders, act.timestamp)
    }

    if (act.name == 'cancelsell') {
      //console.log('cancelsell: ', data.order_id)
      sellOrders({ account: data.executor, order_id: parseInt(data.order_id) }).remove()

      save_price_history(result, buyOrders, act.timestamp)
    }

    if (act.name == 'sellmatch') {
      const record = data.record

      const order = buyOrders({ price: record.unit_price }).order('block_num').first()

      order.ask -= record.bid.amount
      order.bid -= record.ask.amount

      //console.log('after', order.ask, order.bid)

      buyOrders({ order_id: order.order_id, account: order.account }).remove()

      if (order.ask != 0.0 && order.bid != 0.0) {
        buyOrders.insert({ ...order })
      }

      save_price_history(result, buyOrders, act.timestamp)
    }

    // TODO По несколько раз они же тоже не метчатся, несколько ордеров не сжирают, нужно и это учесть
    if (act.name == 'buymatch') {
      const record = data.record

      //console.log('buymatch: ', record.unit_price, '; bid: ', record.bid.amount, '; ask: ', record.ask.amount)

      const order = sellOrders({ price: record.unit_price }).order('block_num').first()
      //const order = sellOrders().order('price').first()
      order.ask -= record.bid.amount
      order.bid -= record.ask.amount

      sellOrders({ order_id: order.order_id, account: order.account }).remove()

      if (order.ask != 0.0 && order.bid != 0.0) {
        sellOrders.insert({ ...order })
      }

      save_price_history(result, buyOrders, act.timestamp)
    }

    if (act.name == 'sellreceipt') {
      const order = data.sell_order


      const bid = quantityToAmount(order.bid)
      const ask = quantityToAmount(order.ask)

      //console.log(`sellreceipt(${order.id}): `, order.unit_price, '; bid: ', bid, '; ask: ', ask, 'time: ', act.timestamp)

      sellOrders.insert({
        account: order.account,
        bid,
        ask,
        price: order.unit_price,
        order_id: parseInt(order.id),
        time: act.timestamp,
        block_num: act.block_num
      })

      save_price_history(result, buyOrders, act.timestamp)
    }

    if (act.name == 'buyreceipt') {
      const order = data.buy_order

      const bid = quantityToAmount(order.bid)
      const ask = quantityToAmount(order.ask)

      //console.log(`buyreceipt(${order.id}): `, order.unit_price, '; bid: ', bid, '; ask: ', ask, 'time: ', act.timestamp)

      buyOrders.insert({
        account: order.account,
        bid,
        ask,
        price: order.unit_price,
        order_id: parseInt(order.id),
        time: act.timestamp,
        block_num: act.block_num
      })

      save_price_history(result, buyOrders, act.timestamp)
    }
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
    // TODO Сделать норм свечи что бы новая не начиналась с разрывом
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
