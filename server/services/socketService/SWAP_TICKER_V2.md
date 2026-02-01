# Swap Ticker v2 (Socket.IO)

## Subscribe
```js
this.$socket.emit('subscribe', {
  room: 'swap-ticker-v2',
  params: { chain, pool, resolution }
})
```

## Event
```js
this.$socket.on('swap-tick-v2', (payload) => {
  // handle update
})
```

## Payload
```ts
type SwapTickV2 = {
  v: 2
  chain: string
  poolId: number
  resolution: string
  time: number        // bar timestamp (ms)
  serverTime: number  // server emit time (ms)
  source?: 'chain' | 'db'

  bar: {
    volumeUSD: number
    sqrtPriceX64: { open: string, high: string, low: string, close: string }
    price: {
      aPerB: { open: string, high: string, low: string, close: string }
      bPerA: { open: string, high: string, low: string, close: string }
    }
  }

  pair: {
    tokenA: { id: string, contract: string, symbol: string, decimals: number }
    tokenB: { id: string, contract: string, symbol: string, decimals: number }
  } | null
}
```

## UI handling
- Filter by `poolId` + `resolution` to avoid stale updates
- Use `bar.price.aPerB` or `bar.price.bPerA` based on UI direction

## Notes
- Resolution normalization: `D/W/M` are accepted and normalized to `1D/1W/1M` on subscribe
- `source: 'chain'` = immediate logswap tick (low latency)
- `source: 'db'` = SwapBar change-stream tick (authoritative)
