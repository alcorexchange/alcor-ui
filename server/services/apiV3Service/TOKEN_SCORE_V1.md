# Token Score v1

`Token Score v1` is the production token quality score used by API v3 analytics.

Properties:
- deterministic
- recalculated on backend
- cached in Redis under `${chain}_token_scores`
- updated every `15` minutes
- fixed scoring window: `30d`

## Output

Per token:

```json
{
  "score": 0,
  "version": "v1",
  "window": "30d",
  "components": {
    "traders": 0,
    "volume": 0,
    "liquidity": 0,
    "holders": 0,
    "activity": 0,
    "stability": 0,
    "age": 0
  },
  "capsApplied": [],
  "metrics": {
    "uniqueTraders": 0,
    "volumeUsd": 0,
    "tvlUsd": 0,
    "turnover": 0,
    "holdersCount": 0,
    "tradesCount": 0,
    "avgDailyTrades": 0,
    "currentPrice": null,
    "rollingHigh30d": null,
    "drawdown30d": null,
    "stabilityPoolId": null,
    "ageDays": null
  }
}
```

`components` contain weighted points, not normalized ratios.

## Data Sources

The score uses only data already present in current analytics infrastructure:
- `volumeUsd`: swap + spot volume aggregated over `30d`
- `tvlUsd`: token-side AMM liquidity, computed as `sum(pool_tvl_usd / 2)` across token pools, with platform-balance liquidity used as fallback floor when higher
- `holdersCount`: `${chain}_token_holders_stats`
- `uniqueTraders`: unique swap + spot traders over `30d`
- `tradesCount`: swap + spot trade count over `30d`
- `price history`: `SwapBar` daily candles over `30d` for a selected reference pool
- `ageDays`: earliest known pool or spot market activity

If a metric is unavailable, that metric is skipped from the normalization denominator instead of blocking score generation.

## Formula

Weights:
- `traders`: `25`
- `volume`: `20`
- `liquidity`: `15`
- `holders`: `10`
- `activity`: `10`
- `stability`: `10`
- `age`: `10`

### 1. Trader Activity

Formula:

```txt
traders_ratio = min(unique_traders_30d / 500, 1)
traders_points = traders_ratio * 25
```

### 2. Volume Quality

Formula:

```txt
turnover = volume_usd_30d / max(tvl_usd, 1)
```

Turnover score:
- `<= 0.1` -> `0`
- `0.1 .. 3` -> linear scale to `1`
- `> 3` -> `1`

```txt
volume_points = turnover_score * 20
```

### 3. Liquidity Depth

```txt
liquidity_ratio = min(tvl_usd / 50000, 1)
liquidity_points = liquidity_ratio * 15
```

### 4. Holder Base

```txt
holders_ratio = min(holders_count / 1000, 1)
holders_points = holders_ratio * 10
```

If holders data is missing, the component is skipped.

### 5. Activity Consistency

```txt
avg_daily_trades = trades_count_30d / 30
```

Activity score:
- `< 10` -> `0`
- `10 .. 100` -> linear scale to `1`
- `> 100` -> `1`

```txt
activity_points = activity_score * 10
```

### 6. Price Stability

Reference source:
- prefer token pools against configured `USD_TOKEN`
- otherwise prefer token pools against chain base token
- otherwise use the highest TVL token pool

Formula:

```txt
rolling_high_30d = max(daily_high over last 30d)
drawdown = current_price / rolling_high_30d
```

Stability score:
- `< 0.3` -> `0`
- `0.3 .. 1` -> linear scale to `1`
- `> 1` is clamped to `1`

```txt
stability_points = stability_score * 10
```

If no suitable reference pool or candle history exists, the component is skipped.

### 7. Age Factor

Formula:

```txt
age_days = floor((now - first_seen_at) / 1 day)
```

Age score:
- `< 3` -> `0`
- `3 .. 30` -> linear scale to `1`
- `> 30` -> `1`

```txt
age_points = age_score * 10
```

If age is unknown, the component is skipped.

## Raw Score and Normalization

```txt
weighted_sum = sum(all available component points)
available_weight = sum(weights for available components)
raw_score = weighted_sum / available_weight * 100
```

This normalization keeps tokens scoreable even when holders, stability, or age data is temporarily unavailable.

## Hard Caps

Caps are applied after normalization:
- `trades_count_30d == 0` -> final score `0`
- `unique_traders_30d < 20` -> final score `<= 30`
- `tvl_usd < 2500` -> final score `<= 40`

Applied caps are emitted in `capsApplied`.

## Notes

- The score is intentionally simple and heuristic-based.
- No wallet clustering, manual labels, ML, or project-declared wallets are used.
- Legacy compatibility fields remain in the cached payload because other server-side consumers still read them.
