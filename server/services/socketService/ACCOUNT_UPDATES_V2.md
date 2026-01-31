# Account Updates v2 (Socket.IO)

## Subscribe
Client should already join the account room:

```js
this.$socket.emit('subscribe', {
  room: 'account',
  params: { chain: network.name, name: user.name }
})
```

## Event
```js
this.$socket.on('account:update-v2', (payload) => {
  // handle update
})
```

## Payload
```ts
type AccountUpdateV2 = {
  v: 2
  chain: string
  account: string

  balances: null | Array<{ contract: string, symbol: string }>
  balancesAll: boolean

  orders: number[]        // market_id[]
  positions: number[]     // posId[]
  accountLimits: boolean

  meta: {
    contract: string
    action: string
    trx_id?: string
    block_num?: number
    block_time?: string
  }
}
```

## UI handling
- balancesAll: true -> loadUserBalances()
- balances[] -> updateBalance({ contract, symbol }) per item
- accountLimits: true -> loadAccountLimits()
- orders[] -> loadOrders(market_id)
- positions[] -> amm/fetchPositions() + amm/fetchPositionsHistory()

## Coverage (by chain actions)
Swap (swap.alcor)
- logswap -> balances
- logmint, logburn -> balances + positions
- logcollect -> balances + positions
- logtransfer -> positions

Dex (alcordexmain / eostokensdex / book.alcor)
- buyreceipt, sellreceipt -> balances + orders + accountLimits
- cancelbuy, cancelsell -> balances + orders + accountLimits
- buymatch, sellmatch -> balances + orders + accountLimits (bidder + asker)

## Notes
- If market/pool not found in DB, payload uses balancesAll: true
- Old events remain for now: "match", "account:update-positions"
