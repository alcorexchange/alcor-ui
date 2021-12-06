export function pushAccountNewMatch(io, m) {
  io.to(`account:${m.chain}.${m.asker}`).emit('match', {
    ask: m.ask,
    market_id: m.market,
    price: m.unit_price
  })

  io.to(`account:${m.chain}.${m.bidder}`).emit('match', {
    bid: m.ask,
    market_id: m.market,
    price: m.unit_price
  })
}

export function pushDeal(io, match) {
  const { market, time, ask, bid, type, unit_price, trx_id, chain } = match
  io.to(`deals:${chain}.${market}`).emit('new_deals', [{ time: new Date(time).getTime(), ask, bid, type, unit_price, trx_id }])
}
