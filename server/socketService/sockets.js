import { Match } from '../models'

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

export function subscribe(io, socket, client) {
  socket.on('subscribe', async ({ room, params }) => {
    if (room == 'deals') {
      socket.join(`deals:${params.chain}.${params.market}`)

      const deals = await Match.find({ chain: params.chain, market: params.market })
        .select('time bid ask unit_price type trx_id')
        .sort({ time: -1 })
        .limit(200)

      socket.emit('new_deals', deals)
    }

    if (room == 'ticker') {
      socket.join(`ticker:${params.chain}.${params.market}.${params.resolution}`)
    }

    if (room == 'orders') {
      socket.join(`orders:${params.chain}.${params.market}`)
    }

    if (room == 'pools') {
      socket.join(`pools:${params.chain}`)
    }

    if (room == 'account') {
      socket.join(`account:${params.chain}.${params.name}`)
    }

    if (room == 'orderbook') {
      const { chain, side, market } = params

      const data = await client.get(`orderbook_${chain}_${side}_${market}`)
      const entries = JSON.parse(data || [])
      const orderbook = Object.values(Object.fromEntries(entries))

      socket.emit(`orderbook_${side}`, orderbook)
      socket.join(`orderbook:${chain}.${side}.${market}`)
    }
  })
}

export function unsubscribe(io, socket) {
  socket.on('unsubscribe', ({ room, params }) => {
    if (room == 'deals') {
      socket.leave(`deals:${params.chain}.${params.market}`)
    }

    if (room == 'ticker') {
      Object.keys(resolutions).map(resolution => {
        socket.leave(`ticker:${params.chain}.${params.market}.${resolution}`)
      })
    }

    if (room == 'orders') {
      socket.leave(`orders:${params.chain}.${params.market}`)
    }

    if (room == 'pools') {
      socket.leave(`pools:${params.chain}`)
    }

    if (room == 'account') {
      socket.leave(`account:${params.chain}.${params.name}`)
    }

    if (room == 'orderbook') {
      const { chain, market } = params

      socket.leave(`orderbook:${chain}.buy.${market}`)
      socket.leave(`orderbook:${chain}.sell.${market}`)
    }
  })
}
