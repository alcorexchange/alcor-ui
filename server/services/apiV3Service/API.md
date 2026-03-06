# API v3 (Analytics + AMM)

Base path: `/api/v3`

Notes:
- `window` is one of: `24h | 7d | 30d | 90d | all`
- `resolution` for charts is one of: `1h | 4h | 1d | 1w`
- `include` is a comma-separated list of optional blocks (e.g. `include=incentives`)
- All responses include `meta` where applicable

## Analytics

### GET `/analytics/overview`
Global overview + top lists.

Query:
- `window` (default: `30d`)
- `include=incentives` (optional, adds farms info to topPools)

Response:
```
{
  "meta": { "chain", "ts", "window", "baseToken", "usdToken" },
  "stats": {
    "tvl", "volume", "fees",
    "swapVolume", "spotVolume", "swapFees", "spotFees",
    "swapTx", "spotTx", "dauAvg", "poolsTotal", "spotPairsTotal"
  },
  "charts": {
    "tvl": [{ "t", "v" }],
    "volume": [{ "t", "v" }],
    "fees": [{ "t", "v" }],
    "swapVolume": [{ "t", "v" }],
    "spotVolume": [{ "t", "v" }],
    "swapFees": [{ "t", "v" }],
    "spotFees": [{ "t", "v" }],
    "items": [{ "t", "tvl", "volume", "fees", "swapVolume", "spotVolume", "swapFees", "spotFees" }]
  },
  "topPools": [PoolCard],
  "topTokens": [TokenCard],
  "topSpotPairs": [SpotPairCard]
}
```

### GET `/analytics/tokens`
Token list (scored, with volumes/TVL).

Query:
- `window` (default: `30d`)
- `search` (symbol/contract/id)
- `sort=score|volume|tvl|price` (default: `score`)
- `order=asc|desc` (default: `desc`)
- `limit` (default: `50`, max: `500`)
- `page` (default: `1`)

Response:
```
{
  "meta": { ... },
  "items": [TokenCard],
  "page", "limit", "total"
}
```

### GET `/analytics/tokens/:id`
Token details + pools and spot pairs.

Query:
- `window` (default: `30d`)
- `include=tx,depth` (optional, applies to `spotPairs`)
- `hide_scam=true|false` (optional, filters spot pairs and spot stats)

Response:
```
{
  "meta": { ... },
  "token": TokenCard + { "scores": { "total", "details" } },
  "pools": [PoolCard],
  "spotPairs": [SpotPairCard]
}
```

### GET `/analytics/tokens/:id/pools`
Pools for token.

Query:
- `window` (default: `30d`)
- `include=incentives` (optional)

Response:
```
{ "meta": { ... }, "items": [PoolCard(+incentives)] }
```

### GET `/analytics/tokens/:id/spot-pairs`
Spot pairs for token.

Query:
- `window` (default: `30d`)
- `include=tx,depth` (optional)
- `hide_scam=true|false`

Response:
```
{ "meta": { ... }, "items": [SpotPairCard] }
```

### GET `/analytics/pools`
AMM pool list.

Query:
- `window` (default: `30d`)
- `sort=volume|tvl|apr` (default: `volume`)
- `order=asc|desc` (default: `desc`)
- `limit` (default: `50`, max: `500`)
- `page` (default: `1`)
- `search` (optional, token symbol/name/contract/id, supports `A/B` or space-separated terms)
- `hide_scam=true|false`
- `include=incentives` (optional)
- `sort=apr` uses 7d annualized APR; with `include=incentives` sorts by `apr.total`, otherwise by fee APR

Response:
```
{ "meta": { ... }, "items": [PoolCard(+incentives)], "page", "limit", "total" }
```

### GET `/analytics/pools/:id`
Pool detail.

Query:
- `window` (default: `30d`)
- `include=incentives` (optional, filtered by `incentives` param)
- `include=farm_cards` (optional, adds `farms` array in FarmCard format)
- `incentives=active|finished|all` (default: `active`)

Response:
```
{ "meta": { ... }, "pool": PoolCard(+incentives) }
```

When `include=farm_cards`, response adds:
```
{ "pool": { "farms": [FarmCard] } }
```

Response always includes swaps count for selected `window` in `pool.tx.swaps`.

### GET `/analytics/farms`
Farms (incentives) list with analytics.

Query:
- `status=active|finished|all` (default: `active`)
- `window` (default: `30d`)
- `search` (reward token or pool token symbol/name/contract/id; supports `A/B` or space-separated terms)
- `min_pool_tvl` (USD threshold for pool TVL; alias: `min_tvl`)
- `min_staked_tvl` (USD threshold for staked TVL)
- `sort=apr|rewards|tvl|staked|remaining|utilization|volume` (default: `apr`)
- `order=asc|desc` (default: `desc`)
- `limit` (default: `50`, max: `500`)
- `page` (default: `1`)
- `hide_scam=true|false`

Response:
```
{
  "meta": { ... },
  "items": [FarmCard],
  "page", "limit", "total"
}
```

### GET `/analytics/spot-pairs`
Spot pairs list.

Query:
- `window` (default: `30d`)
- `sort=volume|price` (default: `volume`)
- `order=asc|desc` (default: `desc`)
- `limit` (default: `50`, max: `500`)
- `page` (default: `1`)
- `hide_scam=true|false` (optional)
- `include=tx,depth` (optional; when omitted, both are included by default)

Response:
```
{ "meta": { ... }, "items": [SpotPairCard], "page", "limit", "total" }
```

### GET `/analytics/spot-pairs/:id`
Spot pair detail.

Query:
- `window` (default: `30d`)
- `include=tx,depth` (optional; when omitted, both are included by default)

Response:
```
{ "meta": { ... }, "market": SpotPairCard }
```

### GET `/analytics/global/charts`
Global chart points.

Query:
- `window` (default: `30d`)
- `resolution=1h|4h|1d|1w` (default: `1d`)

Response:
```
{
  "meta": { ... },
  "charts": {
    "tvl": [{ "t", "v" }],
    "volume": [{ "t", "v" }],
    "fees": [{ "t", "v" }],
    "swapVolume": [{ "t", "v" }],
    "spotVolume": [{ "t", "v" }],
    "swapFees": [{ "t", "v" }],
    "spotFees": [{ "t", "v" }]
  },
  "items": [ { "t", "tvl", "volume", "fees", "swapVolume", "spotVolume", "swapFees", "spotFees" } ]
}
```

### GET `/analytics/pools/:id/charts`
Pool analytics chart points (`tvl/volume/fees`).

Query:
- `window` (default: `30d`)
- `resolution=1h|4h|1d|1w` (default: `1d`)
- `from` (optional ms timestamp, enables custom range)
- `to` (optional ms timestamp, enables custom range)

Response:
```
{
  "meta": { ... },
  "poolId": 123,
  "feeRate": 0.003,
  "charts": {
    "tvl": [{ "t", "v" }],
    "volume": [{ "t", "v" }],
    "fees": [{ "t", "v" }]
  },
  "items": [ { "t", "tvl", "volume", "fees" } ]
}
```

### GET `/analytics/pools/:id/candles`
Swap (AMM) candles.

Query:
- `resolution=1h|4h|1d|1w` (default: `1h`)
- `from` (ms timestamp)
- `to` (ms timestamp)
- `volumeField=volumeUSD|volumeA|volumeB`
- `reverse=true|false`

Response:
```
{ "meta": { ... }, "timeframe", "frame", "items": [ { "time", "open", "high", "low", "close", "volume" } ] }
```

### GET `/analytics/spot-pairs/:id/candles`
Spot candles.

Query:
- `resolution=1h|4h|1d|1w` (default: `1h`)
- `from` (ms timestamp)
- `to` (ms timestamp)

Response:
```
{ "meta": { ... }, "timeframe", "frame", "items": [ { "time", "open", "high", "low", "close", "volume" } ] }
```

## AMM

### GET `/amm/account/:account/positions`
Positions and incentives for account.

### GET `/amm/positions/:id`
Single position details.

### GET `/amm/pools/:id/positions`
Positions for pool.

### GET `/amm/account/:account/history`
Position history for account (mint/burn/collect), optimized for cursor pagination.

Query:
- `limit` (default `100`, max `500`)
- `cursorTime` (ms timestamp)
- `cursorId` (Mongo ObjectId from previous `pageInfo.nextCursor.cursorId`)
- `type` or `types` (`mint,burn,collect` or `all`)
- `search` (one text input: pool id or token `id/symbol/contract`)
- `withPool=true|false` (or `includePool=true`) to include extended pool info in each item
- `poolId`
- `positionId`

Response:
```
{
  "items": [
    {
      "positionId",
      "poolId",
      "owner",
      "type",
      "tokenA",
      "tokenB",
      "tokenAUSDPrice",
      "tokenBUSDPrice",
      "totalUSDValue",
      "liquidity",
      "trxId",
      "time"
    }
  ],
  "pageInfo": {
    "hasMore",
    "nextCursor": { "cursorTime", "cursorId" } | null
  }
}
```

### GET `/amm/positions/:id/history`
History for a single position.

Query:
- `limit`
- `cursorTime`
- `cursorId`
- `type` or `types`
- `poolId`
- `owner`
- `withPool=true|false` (or `includePool=true`)

### GET `/amm/pools/:id/history`
History for a pool.

Query:
- `limit`
- `cursorTime`
- `cursorId`
- `type` or `types`
- `positionId`
- `owner`
- `withPool=true|false` (or `includePool=true`)

### GET `/amm/pools/:id`
Pool + incentives + staking summary.

(See `server/services/apiV3Service/amm.ts` for exact response shape.)

## Swap

### GET `/swap/pools/:poolId/liquidity-distribution`
UI-friendly liquidity distribution for range selector.

Query:
- `priceMode=quotePerBase|basePerQuote` (default: `quotePerBase`)
- `bins` (default: `120`, max: `300`)

Response:
```
{
  "poolId": 1129,
  "chain": "wax",
  "priceMode": "quotePerBase",
  "currentPrice": 3.72058,
  "minPrice": 0.5,
  "maxPrice": 8.0,
  "bins": [
    { "priceLower": 3.50, "priceUpper": 3.55, "liquidity": 12345.67 }
  ],
  "meta": {
    "updatedAt": "2026-02-27T21:00:00.000Z",
    "binCount": 120
  }
}
```

Notes:
- `currentPrice > 0` always.
- Bins are sorted by price, contiguous, and without overlaps.
- `liquidity >= 0`; `NaN`/`Infinity` are not returned.
- If no liquidity is available, `bins` is empty while `currentPrice/minPrice/maxPrice` stay valid.

## Launchpad

Base path: `/api/v3/launchpad`

Notes:
- Launchpad indexes only `token/baseToken` pools for current chain.
- Example for Proton: only `token/XPR` pools are included.

### GET `/launchpad/new`
New launchpad tokens list for the last 7 days (sorted by newest first).

Query:
- `limit` (default: `50`, max: `200`)
- `cursor` (offset pagination; optional)
- `search` or `q` (optional substring search by `symbol/name/token_id/contract`)
- `hide_scam=true|false` (default: `true`)

### GET `/launchpad/tokens`
Unified launchpad tokens list for tabs (`trending/organic/all/new/graduated`) with server-side sorting and keyset cursor.

Query:
- `list=trending|organic|all|new|graduated` (default: `trending`)
- `sort=score|age|vol24h|liq|mcap` (default: `score`)
- `dir=desc|asc` (default: `desc`)
- `limit` (default: `100`, max: `200`)
- `cursor` (opaque keyset cursor from previous response)
- `search` or `q` (optional substring search by `symbol/name/token_id/contract`)
- `hide_scam=true|false` (default: `true`)

Selection rules:
- `trending`: limited universe, top `50` by weekly trend score (focus on growth of traders/trades/liquidity/price).
- `organic`: limited universe, top `50` by organic momentum score (previous trending logic).
- `new`: tokens from last `7d` window.
- `all`: full launchpad index.
- `graduated`: graduated list.

### GET `/launchpad/trending`
Trending launchpad list (weekly growth score; traders/trades/liquidity/price focused).

Query:
- `limit` (default: `50`, max: `200`)
- `cursor` (offset pagination; optional)
- `search` or `q` (optional substring search by `symbol/name/token_id/contract`)
- `hide_scam=true|false` (default: `true`)

### GET `/launchpad/organic`
Organic launchpad list (previous trending momentum logic).

Query:
- `limit` (default: `50`, max: `200`)
- `cursor` (offset pagination; optional)
- `search` or `q` (optional substring search by `symbol/name/token_id/contract`)
- `hide_scam=true|false` (default: `true`)

### GET `/launchpad/graduated`
Graduated tokens list.

Query:
- `limit` (default: `50`, max: `200`)
- `cursor` (offset pagination; optional)
- `search` or `q` (optional substring search by `symbol/name/token_id/contract`)
- `hide_scam=true|false` (default: `true`)

### GET `/launchpad/search`
Search tokens by word.

Query:
- `q` or `search` (required)
- `list=trending|organic|new|graduated` (default: `trending`)
- `limit` (default: `50`, max: `200`)
- `cursor` (offset pagination; optional)
- `hide_scam=true|false` (default: `true`)

### GET `/launchpad/token/:tokenId/summary`
Live token summary:
- `price` (quote/base/usd)
- `liquidity` (base/usd)
- `volume` and `trades_count` (`5m/1h/24h`)
- `price_change_pct` (`5m/1h/24h`)
- `last_trade`
- `status` (`LAUNCH|OPEN|GRADUATED|UNKNOWN`)

Query:
- `hide_scam=true|false` (default: `true`)

### GET `/launchpad/token/:tokenId/trades`
Recent token trades (Redis-backed).

Query:
- `limit` (default: `100`, max: `200`)
- `hide_scam=true|false` (default: `true`)

### GET `/launchpad/token/:tokenId/holders`
Optional holders endpoint (top-holders source may be unavailable; returns stats + empty `items` in that case).

Query:
- `limit` (default: `50`, max: `200`)
- `hide_scam=true|false` (default: `true`)

---

## Shared response shapes

### TokenCard
```
{
  "id", "symbol", "contract", "name", "decimals", "logo",
  "price": { "usd" },
  "liquidity": { "tvl" },
  "volume": { "swap", "spot", "total" },
  "pairs": { "pools", "spots" },
  "scores": { "total" }
}
```

### PoolCard
```
{
  "id", "fee",
  "tokenA", "tokenB",
  "price": { "aPerB", "bPerA", "change24h" },
  "liquidity": { "tvl" },
  "volume": { "usd" },
  "tx": { "swaps" },
  "incentives": [IncentiveSummary] // only when include=incentives
}
```

### SpotPairCard
```
{
  "id",
  "base", "quote",
  "price": { "last", "change24h" },
  "spread",
  "volume": { "usd" },
  "orders": { "bidDepthUsd", "askDepthUsd" },
  "tx": { "matches" }
}
```
`orders.*DepthUsd` is computed from top-of-book levels within a bounded price band around current pair price (to avoid far-outlier orders distorting depth).

### FarmCard
```
{
  "id",
  "poolId",
  "isFinished",
  "daysRemain",
  "periodFinish",
  "reward",
  "rewardSymbol",
  "rewardTokenId",
  "rewardTokenPrice",
  "rewardPerDay",
  "rewardPerDayUSD",
  "apr",
  "utilizationPct",
  "stakedTvlUSD",
  "poolTvlUSD",
  "poolVolumeUSD",
  "pool": PoolCard
}
```

### IncentiveSummary
```
{
  "incentiveId",
  "poolId",
  "reward",
  "rewardPerDay",
  "rewardPerDayUSD",
  "periodFinish",
  "isFinished",
  "daysRemain",
  "utilizationPct",
  "rewardTokenId",
  "apr"
}
```
