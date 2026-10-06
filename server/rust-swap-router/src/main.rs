use axum::{
    extract::{Query, State},
    http::StatusCode,
    response::Json,
    routing::get,
    Router,
};
use serde::{Deserialize, Serialize};
use std::collections::{BTreeMap, HashMap};
use std::sync::Arc;
use tokio::sync::RwLock;
use tower_http::cors::CorsLayer;
use tracing::{info, warn, error};

mod swap_math;
mod u256;

use swap_math::{compute_swap_step, get_sqrt_ratio_at_tick, MIN_TICK, MAX_TICK};

// ============ Pool Data Structures ============

#[derive(Debug, Clone)]
pub struct PoolData {
    pub id: u32,
    pub token_a_id: String,
    pub token_b_id: String,
    pub fee: u32,
    pub sqrt_price_x64: u128,
    pub liquidity: u128,
    pub tick_current: i32,
    pub ticks: BTreeMap<i32, TickData>,
    pub active: bool,
}

#[derive(Debug, Clone)]
pub struct TickData {
    pub liquidity_net: i128,
}

#[derive(Debug, Clone, Serialize)]
pub struct SwapResult {
    pub amount_in: String,
    pub amount_out: String,
    pub sqrt_price_x64_after: String,
    pub tick_after: i32,
}

// ============ App State ============

type Pools = Arc<RwLock<HashMap<String, HashMap<u32, PoolData>>>>; // chain -> pool_id -> pool

#[derive(Clone)]
struct AppState {
    pools: Pools,
}

// ============ Swap Logic ============

impl PoolData {
    pub fn swap(&self, zero_for_one: bool, amount_specified: i128) -> SwapResult {
        let sqrt_price_limit = if zero_for_one {
            get_sqrt_ratio_at_tick(MIN_TICK) + 1
        } else {
            get_sqrt_ratio_at_tick(MAX_TICK) - 1
        };

        let exact_input = amount_specified >= 0;

        let mut amount_specified_remaining = amount_specified;
        let mut amount_calculated: i128 = 0;
        let mut sqrt_price_x64 = self.sqrt_price_x64;
        let mut tick = self.tick_current;
        let mut liquidity = self.liquidity;

        let mut iterations = 0;
        const MAX_ITERATIONS: u32 = 1000;

        while iterations < MAX_ITERATIONS && amount_specified_remaining != 0 && sqrt_price_x64 != sqrt_price_limit {
            iterations += 1;
            let sqrt_price_start_x64 = sqrt_price_x64;

            let (tick_next, initialized) = self.next_initialized_tick(tick, zero_for_one);
            let tick_next = tick_next.max(MIN_TICK).min(MAX_TICK);
            let sqrt_price_next_x64 = get_sqrt_ratio_at_tick(tick_next);

            let target_price = if (zero_for_one && sqrt_price_next_x64 < sqrt_price_limit)
                || (!zero_for_one && sqrt_price_next_x64 > sqrt_price_limit)
            {
                sqrt_price_limit
            } else {
                sqrt_price_next_x64
            };

            let (sqrt_price_new, amount_in, amount_out, fee_amount) = compute_swap_step(
                sqrt_price_x64,
                target_price,
                liquidity,
                amount_specified_remaining,
                self.fee,
            );

            sqrt_price_x64 = sqrt_price_new;

            if exact_input {
                amount_specified_remaining -= amount_in as i128 + fee_amount as i128;
                amount_calculated -= amount_out as i128;
            } else {
                amount_specified_remaining += amount_out as i128;
                amount_calculated += amount_in as i128 + fee_amount as i128;
            }

            if sqrt_price_x64 == sqrt_price_next_x64 {
                if initialized {
                    if let Some(tick_data) = self.ticks.get(&tick_next) {
                        let liquidity_net = if zero_for_one {
                            -tick_data.liquidity_net
                        } else {
                            tick_data.liquidity_net
                        };
                        liquidity = add_liquidity_delta(liquidity, liquidity_net);
                    }
                }
                tick = if zero_for_one { tick_next - 1 } else { tick_next };
            } else if sqrt_price_x64 != sqrt_price_start_x64 {
                tick = swap_math::get_tick_at_sqrt_ratio(sqrt_price_x64);
            }
        }

        let (amount_a, amount_b) = if zero_for_one == exact_input {
            (
                (amount_specified - amount_specified_remaining).unsigned_abs(),
                amount_calculated.unsigned_abs(),
            )
        } else {
            (
                amount_calculated.unsigned_abs(),
                (amount_specified - amount_specified_remaining).unsigned_abs(),
            )
        };

        SwapResult {
            amount_in: if zero_for_one { amount_a } else { amount_b }.to_string(),
            amount_out: if zero_for_one { amount_b } else { amount_a }.to_string(),
            sqrt_price_x64_after: sqrt_price_x64.to_string(),
            tick_after: tick,
        }
    }

    fn next_initialized_tick(&self, tick: i32, zero_for_one: bool) -> (i32, bool) {
        if self.ticks.is_empty() {
            return if zero_for_one { (MIN_TICK, false) } else { (MAX_TICK, false) };
        }

        if zero_for_one {
            for (&tick_index, _) in self.ticks.range(..=tick).rev() {
                if tick_index < tick {
                    return (tick_index, true);
                }
            }
            (MIN_TICK, false)
        } else {
            for (&tick_index, _) in self.ticks.range((tick + 1)..) {
                return (tick_index, true);
            }
            (MAX_TICK, false)
        }
    }
}

fn add_liquidity_delta(liquidity: u128, delta: i128) -> u128 {
    if delta < 0 {
        liquidity.saturating_sub(delta.unsigned_abs())
    } else {
        liquidity.saturating_add(delta as u128)
    }
}

// ============ Pool Parsing ============

// Helper to get token id - handles both formats:
// - API format: { "id": "WAX-eosio.token" }
// - Pool.toJSON format: { "symbol": "WAX", "contract": "eosio.token" }
fn get_token_id(token_json: &serde_json::Value) -> Option<String> {
    // Try API format first
    if let Some(id) = token_json.get("id").and_then(|v| v.as_str()) {
        return Some(id.to_string());
    }
    // Try Pool.toJSON format
    let symbol = token_json.get("symbol")?.as_str()?;
    let contract = token_json.get("contract")?.as_str()?;
    Some(format!("{}-{}", symbol, contract))
}

fn parse_pool_from_json(json: &serde_json::Value) -> Option<PoolData> {
    let id = json.get("id")?.as_u64()? as u32;
    let token_a_id = get_token_id(json.get("tokenA")?)?;
    let token_b_id = get_token_id(json.get("tokenB")?)?;
    let fee = json.get("fee")?.as_u64()? as u32;
    let sqrt_price_x64 = json.get("sqrtPriceX64")?.as_str()?.parse().ok()?;
    let liquidity = json.get("liquidity")?.as_str()?.parse().ok()?;
    let tick_current = json.get("tickCurrent")?.as_i64()? as i32;
    let active = json.get("active").and_then(|v| v.as_bool()).unwrap_or(true);

    let mut ticks = BTreeMap::new();

    // Try both "ticks" (API format) and "tickDataProvider" (Pool.toJSON format)
    let ticks_arr = json.get("ticks").and_then(|t| t.as_array())
        .or_else(|| json.get("tickDataProvider").and_then(|t| t.as_array()));

    if let Some(ticks_arr) = ticks_arr {
        for tick_json in ticks_arr {
            if let (Some(id), Some(net)) = (
                tick_json.get("id").and_then(|v| v.as_i64()),
                tick_json.get("liquidityNet").and_then(|v| v.as_str()),
            ) {
                if let Ok(liquidity_net) = net.parse::<i128>() {
                    ticks.insert(id as i32, TickData { liquidity_net });
                }
            }
        }
    }

    Some(PoolData {
        id,
        token_a_id,
        token_b_id,
        fee,
        sqrt_price_x64,
        liquidity,
        tick_current,
        ticks,
        active,
    })
}

// ============ HTTP Handlers ============

#[derive(Deserialize)]
struct SwapQuery {
    chain: String,
    pool_id: u32,
    zero_for_one: bool,
    amount: String,
}

#[derive(Serialize)]
struct SwapResponse {
    success: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    result: Option<SwapResult>,
    #[serde(skip_serializing_if = "Option::is_none")]
    error: Option<String>,
}

async fn swap_handler(
    State(state): State<AppState>,
    Query(params): Query<SwapQuery>,
) -> Result<Json<SwapResponse>, StatusCode> {
    let pools = state.pools.read().await;

    let chain_pools = pools.get(&params.chain).ok_or(StatusCode::NOT_FOUND)?;
    let pool = chain_pools.get(&params.pool_id).ok_or(StatusCode::NOT_FOUND)?;

    let amount: i128 = params.amount.parse().map_err(|_| StatusCode::BAD_REQUEST)?;

    let result = pool.swap(params.zero_for_one, amount);

    Ok(Json(SwapResponse {
        success: true,
        result: Some(result),
        error: None,
    }))
}

#[derive(Deserialize)]
struct BatchSwapItem {
    pool_id: u32,
    zero_for_one: bool,
    amount: String,
}

#[derive(Deserialize)]
struct BatchSwapQuery {
    chain: String,
}

async fn batch_swap_handler(
    State(state): State<AppState>,
    Query(query): Query<BatchSwapQuery>,
    Json(swaps): Json<Vec<BatchSwapItem>>,
) -> Result<Json<Vec<SwapResponse>>, StatusCode> {
    let pools = state.pools.read().await;
    let chain_pools = pools.get(&query.chain).ok_or(StatusCode::NOT_FOUND)?;

    let results: Vec<SwapResponse> = swaps
        .iter()
        .map(|swap| {
            match chain_pools.get(&swap.pool_id) {
                Some(pool) => {
                    match swap.amount.parse::<i128>() {
                        Ok(amount) => {
                            let result = pool.swap(swap.zero_for_one, amount);
                            SwapResponse { success: true, result: Some(result), error: None }
                        }
                        Err(_) => SwapResponse { success: false, result: None, error: Some("Invalid amount".into()) }
                    }
                }
                None => SwapResponse { success: false, result: None, error: Some("Pool not found".into()) }
            }
        })
        .collect();

    Ok(Json(results))
}

async fn stats_handler(State(state): State<AppState>) -> Json<serde_json::Value> {
    let pools = state.pools.read().await;
    let mut stats = serde_json::Map::new();

    for (chain, chain_pools) in pools.iter() {
        stats.insert(chain.clone(), serde_json::json!({
            "pools": chain_pools.len(),
            "active": chain_pools.values().filter(|p| p.active).count(),
        }));
    }

    Json(serde_json::Value::Object(stats))
}

// ============ Initial Pool Loading ============

#[derive(Deserialize, Debug)]
struct ApiToken {
    id: String,
}

#[derive(Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
struct ApiPool {
    id: u32,
    #[serde(rename = "tokenA")]
    token_a: ApiToken,
    #[serde(rename = "tokenB")]
    token_b: ApiToken,
    fee: u32,
    #[serde(rename = "sqrtPriceX64")]
    sqrt_price_x64: String,
    liquidity: String,
    #[serde(rename = "tickCurrent")]
    tick_current: i32,
    active: Option<bool>,
}

#[derive(Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
struct ApiTick {
    id: i32,
    liquidity_net: String,
}

async fn load_initial_pools(pools: Pools, api_base_url: &str, chain: &str) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let client = reqwest::Client::new();

    // Fetch all pools
    let pools_url = format!("{}/pools", api_base_url);
    info!("Loading pools from {}", pools_url);

    let api_pools: Vec<ApiPool> = client
        .get(&pools_url)
        .send()
        .await?
        .json()
        .await?;

    info!("Fetched {} pools", api_pools.len());

    let mut loaded_count = 0;

    for api_pool in api_pools {
        // Fetch ticks for each pool
        let ticks_url = format!("{}/pools/{}/ticks", api_base_url, api_pool.id);

        let api_ticks: Vec<ApiTick> = match client.get(&ticks_url).send().await {
            Ok(resp) => resp.json().await.unwrap_or_default(),
            Err(e) => {
                warn!("Failed to fetch ticks for pool {}: {}", api_pool.id, e);
                Vec::new()
            }
        };

        // Convert to internal format
        let mut ticks = BTreeMap::new();
        for tick in api_ticks {
            if let Ok(liquidity_net) = tick.liquidity_net.parse::<i128>() {
                ticks.insert(tick.id, TickData { liquidity_net });
            }
        }

        let sqrt_price_x64: u128 = api_pool.sqrt_price_x64.parse().unwrap_or(0);
        let liquidity: u128 = api_pool.liquidity.parse().unwrap_or(0);

        if sqrt_price_x64 == 0 || liquidity == 0 {
            continue;
        }

        let pool = PoolData {
            id: api_pool.id,
            token_a_id: api_pool.token_a.id,
            token_b_id: api_pool.token_b.id,
            fee: api_pool.fee,
            sqrt_price_x64,
            liquidity,
            tick_current: api_pool.tick_current,
            ticks,
            active: api_pool.active.unwrap_or(true),
        };

        let mut pools_guard = pools.write().await;
        pools_guard
            .entry(chain.to_string())
            .or_insert_with(HashMap::new)
            .insert(pool.id, pool);

        loaded_count += 1;
    }

    info!("Loaded {} pools for chain {}", loaded_count, chain);
    Ok(())
}

// ============ Redis Subscriber ============

async fn redis_subscriber(pools: Pools, redis_url: &str) {
    loop {
        match redis_subscribe_loop(pools.clone(), redis_url).await {
            Ok(_) => info!("Redis subscriber ended normally"),
            Err(e) => warn!("Redis subscriber error: {}, reconnecting...", e),
        }
        tokio::time::sleep(tokio::time::Duration::from_secs(5)).await;
    }
}

async fn redis_subscribe_loop(pools: Pools, redis_url: &str) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let client = redis::Client::open(redis_url)?;
    let mut pubsub = client.get_async_pubsub().await?;

    pubsub.subscribe("swap:pool:instanceUpdated").await?;
    info!("Subscribed to swap:pool:instanceUpdated");

    let mut stream = pubsub.into_on_message();

    while let Some(msg) = futures_util::StreamExt::next(&mut stream).await {
        let payload: String = msg.get_payload()?;

        if let Ok(json) = serde_json::from_str::<serde_json::Value>(&payload) {
            if let Some(chain) = json.get("chain").and_then(|c| c.as_str()) {
                if let Some(pool_json) = json.get("pool") {
                    if let Some(pool) = parse_pool_from_json(pool_json) {
                        let pool_id = pool.id;
                        let ticks_count = pool.ticks.len();
                        let mut pools = pools.write().await;
                        pools
                            .entry(chain.to_string())
                            .or_insert_with(HashMap::new)
                            .insert(pool_id, pool);
                        info!("[{}] Pool #{} updated ({} ticks)", chain, pool_id, ticks_count);
                    }
                }
            }
        }
    }

    Ok(())
}

// ============ Main ============

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt::init();

    let redis_url = std::env::var("REDIS_URL").unwrap_or_else(|_| "redis://127.0.0.1/".to_string());
    let port = std::env::var("PORT").unwrap_or_else(|_| "3001".to_string());
    let api_base_url = std::env::var("API_BASE_URL").unwrap_or_else(|_| "http://localhost:7002".to_string());
    let chains: Vec<String> = std::env::var("CHAINS")
        .unwrap_or_else(|_| "wax".to_string())
        .split(',')
        .map(|s| s.trim().to_string())
        .collect();

    let pools: Pools = Arc::new(RwLock::new(HashMap::new()));

    // Load initial pools for each chain
    for chain in &chains {
        let chain_api_url = format!("{}/{}/v2/swapV2", api_base_url, chain);
        info!("Loading initial pools for chain {} from {}", chain, chain_api_url);

        if let Err(e) = load_initial_pools(pools.clone(), &chain_api_url, chain).await {
            error!("Failed to load pools for {}: {}", chain, e);
        }
    }

    // Start Redis subscriber
    let pools_clone = pools.clone();
    let redis_url_clone = redis_url.clone();
    tokio::spawn(async move {
        redis_subscriber(pools_clone, &redis_url_clone).await;
    });

    let state = AppState { pools };

    let app = Router::new()
        .route("/swap", get(swap_handler))
        .route("/batch", axum::routing::post(batch_swap_handler))
        .route("/stats", get(stats_handler))
        .layer(CorsLayer::permissive())
        .with_state(state);

    let listener = tokio::net::TcpListener::bind(format!("0.0.0.0:{}", port))
        .await
        .unwrap();

    info!("Rust Swap Router listening on port {}", port);

    axum::serve(listener, app).await.unwrap();
}
