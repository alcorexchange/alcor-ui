export function pushAccountNewMatch(io, m) {
  const side = m.type == 'buymatch' ? 'buy' : 'sell'
  const base_volume = m.type == 'buymatch' ? m.ask : m.bid
  const target_volume = m.type == 'buymatch' ? m.bid : m.ask

  io.to(`account:${m.chain}.${m.asker}`).emit('match', {
    ask: m.type == 'sellmatch' ? m.ask : m.bid,
    market_id: m.market,
    price: m.unit_price,
    side,
    match_type: m.type,
    base_volume,
    target_volume
  })

  io.to(`account:${m.chain}.${m.bidder}`).emit('match', {
    bid: m.type == 'sellmatch' ? m.bid : m.ask,
    market_id: m.market,
    price: m.unit_price,
    side,
    match_type: m.type,
    base_volume,
    target_volume
  })
}

export function pushDeal(io, match) {
  const { market, time, ask, bid, type, unit_price, trx_id, chain } = match
  io.to(`deals:${chain}.${market}`).emit('new_deals', [{ time: new Date(time).getTime(), ask, bid, type, unit_price, trx_id }])
}

// export function pushAccountUpdatePositions(io, match) {
//   const { market, time, ask, bid, type, unit_price, trx_id, chain } = match
//   io.to(`deals:${chain}.${market}`).emit('new_deals', [{ time: new Date(time).getTime(), ask, bid, type, unit_price, trx_id }])
// }
