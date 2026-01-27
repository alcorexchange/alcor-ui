# Rust Swap Router

High-performance swap calculation service for Alcor DEX. Drop-in replacement for Node.js swap router with zero serialization overhead.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Rust Swap Router                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐     ┌─────────────┐     ┌──────────────┐  │
│  │   Startup   │────▶│  In-Memory  │◀────│    Redis     │  │
│  │ Pool Loader │     │    Pools    │     │  Subscriber  │  │
│  └─────────────┘     └──────┬──────┘     └──────────────┘  │
│         │                   │                    │          │
│         ▼                   ▼                    ▼          │
│  ┌─────────────┐     ┌─────────────┐     ┌──────────────┐  │
│  │  HTTP API   │     │ Swap Math   │     │   Channel:   │  │
│  │  /pools     │     │  (U256)     │     │ instanceUp-  │  │
│  │  /ticks     │     │             │     │   dated      │  │
│  └─────────────┘     └─────────────┘     └──────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## How It Works

1. **Startup**: Loads all pools from HTTP API (`/pools` + `/pools/:id/ticks`)
2. **Real-time Updates**: Subscribes to Redis `swap:pool:instanceUpdated` for live pool changes
3. **Swap Calculation**: Uses U256 math matching C++ smart contract exactly
4. **HTTP API**: Serves swap calculations without serialization overhead

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3001 | HTTP server port |
| `REDIS_URL` | redis://127.0.0.1/ | Redis connection URL |
| `API_BASE_URL` | http://localhost:7002 | Base URL for Alcor API |
| `CHAINS` | wax | Comma-separated chains (wax,eos,telos,proton) |

## Build & Run

```bash
# Build
cargo build --release

# Run (from rust-swap-router directory)
CHAINS=wax,eos API_BASE_URL=http://localhost:7002 ./target/release/swap-router

# Or with full path
CHAINS=wax API_BASE_URL=http://localhost:7002 \
  /path/to/ui/server/rust-swap-router/target/release/swap-router
```

## API Endpoints

### GET /swap
Single swap calculation.

```bash
http "localhost:3001/swap?chain=wax&pool_id=1&zero_for_one=true&amount=1000000"
```

Parameters:
- `chain` - Chain name (wax, eos, etc.)
- `pool_id` - Pool ID
- `zero_for_one` - Swap direction (true = tokenA→tokenB)
- `amount` - Input amount as string

Response:
```json
{
  "success": true,
  "result": {
    "amount_in": "1000000",
    "amount_out": "999000",
    "sqrt_price_x64_after": "18446744073709551616",
    "tick_after": 0
  }
}
```

### POST /batch
Batch swap calculations (for route finding).

```bash
http POST "localhost:3001/batch?chain=wax" \
  Content-Type:application/json \
  <<< '[{"pool_id":1,"zero_for_one":true,"amount":"1000000"}]'
```

### GET /stats
Pool statistics per chain.

```bash
http localhost:3001/stats
```

Response:
```json
{
  "wax": { "pools": 150, "active": 145 },
  "eos": { "pools": 80, "active": 78 }
}
```

## Redis Integration

### Channel: `swap:pool:instanceUpdated`

Publisher (swapV2Service) sends:
```json
{
  "chain": "wax",
  "pool": {
    "id": 1,
    "tokenA": { "symbol": "WAX", "contract": "eosio.token", "decimals": 8 },
    "tokenB": { "symbol": "USDT", "contract": "tethertether", "decimals": 4 },
    "fee": 3000,
    "sqrtPriceX64": "18446744073709551616",
    "liquidity": "1000000000000",
    "tickCurrent": 0,
    "tickDataProvider": [
      { "id": -100, "liquidityNet": "1000000", ... }
    ],
    "active": true
  }
}
```

## File Structure

```
rust-swap-router/
├── Cargo.toml
├── README.md
└── src/
    ├── main.rs       # HTTP server, Redis subscriber, pool management
    ├── swap_math.rs  # Tick math, sqrt price math, swap step calculation
    └── u256.rs       # 256-bit unsigned integer arithmetic
```

## Swap Math

The swap calculation matches the C++ smart contract exactly:

- `get_sqrt_ratio_at_tick(tick)` - Convert tick to sqrt price
- `get_tick_at_sqrt_ratio(sqrt_price)` - Convert sqrt price to tick
- `compute_swap_step(...)` - Single swap step within a tick range

All calculations use custom U256 implementation for 256-bit precision.

## Troubleshooting

### Empty stats `{}`
Pools didn't load at startup. Check:
1. API is running: `http localhost:7002/wax/v2/swapV2/pools`
2. Correct API_BASE_URL
3. Check startup logs for errors

### Pool not found (404)
Pool may not exist or wasn't loaded. Check:
1. `http localhost:3001/stats` - are pools loaded?
2. Verify pool_id exists in the chain

### No real-time updates
Check Redis connection:
1. Redis is running
2. REDIS_URL is correct
3. swapV2Service is publishing updates
