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
    "tvl", "swapVolume", "spotVolume", "swapFees", "spotFees",
    "swapTx", "spotTx", "dauAvg", "poolsTotal", "spotPairsTotal"
  },
  "charts": {
    "tvl": [{ "t", "v" }],
    "swapVolume": [{ "t", "v" }],
    "spotVolume": [{ "t", "v" }]
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

Response:
```
{ "meta": { ... }, "items": [SpotPairCard] }
```

### GET `/analytics/pools`
AMM pool list.

Query:
- `window` (default: `30d`)
- `sort=volume|tvl` (default: `volume`)
- `order=asc|desc` (default: `desc`)
- `limit` (default: `50`, max: `500`)
- `page` (default: `1`)
- `search` (optional, token symbol/name/contract/id, supports `A/B` or space-separated terms)
- `hide_scam=true|false`
- `include=incentives` (optional)

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

### GET `/analytics/farms`
Farms (incentives) list with analytics.

Query:
- `status=active|finished|all` (default: `active`)
- `window` (default: `30d`)
- `search` (token symbol/contract/pool id)
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
- `include=tx,depth` (optional)

Response:
```
{ "meta": { ... }, "items": [SpotPairCard], "page", "limit", "total" }
```

### GET `/analytics/spot-pairs/:id`
Spot pair detail.

Query:
- `window` (default: `30d`)
- `include=tx,depth` (optional)

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
{ "meta": { ... }, "items": [ { "t", "tvl", "swapVolume", "spotVolume", "swapFees", "spotFees" } ] }
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

### GET `/amm/positions/:account`
Positions and incentives for account (from existing v3 amm).

### GET `/amm/positions/:account/:positionId`
Single position details.

### GET `/amm/pools/positions/:account`
Positions grouped by pools.

### GET `/amm/pools/:id`
Pool + incentives + staking summary.

(See `server/services/apiV3Service/amm.ts` for exact response shape.)

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
