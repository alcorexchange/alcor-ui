// Swap mathematics matching C++ contract implementation
use crate::u256::U256;

// Constants matching C++ constants.hpp
const Q64: u128 = 0x10000000000000000; // 1 << 64
const FIXED_POINT_64: u32 = 64;
const BAR_FEE: u32 = 1000000;
const UINT128_MAX: u128 = u128::MAX;

// Tick math constants from C++ tick_math.hpp
pub const MIN_TICK: i32 = -443636;
pub const MAX_TICK: i32 = 443636;
const MIN_SQRT_RATIO: u128 = 4295048017;
const MAX_SQRT_RATIO: u128 = 79226673515401279992447579062;

/// Get sqrt ratio at tick - matching C++ TickMath::getSqrtRatioAtTick
pub fn get_sqrt_ratio_at_tick(tick: i32) -> u128 {
    let abs_tick = tick.abs() as u32;

    if abs_tick > MAX_TICK as u32 {
        // Return boundary values instead of panic
        return if tick > 0 { MAX_SQRT_RATIO } else { MIN_SQRT_RATIO };
    }

    // Start with ratio based on C++ implementation
    let mut ratio = if abs_tick & 0x1 != 0 {
        U256::from_dec_str("340265354078544963557816517032075149313").unwrap() // 0xfffcb933bd6fad37aa2d162d1a594001
    } else {
        U256::from_dec_str("340282366920938463463374607431768211456").unwrap() // 0x100000000000000000000000000000000
    };

    // Apply bit shifts matching C++ implementation exactly
    if abs_tick & 0x2 != 0 {
        ratio = (ratio * U256::from_dec_str("340248342086729790484326174814286782778").unwrap()) >> 128;
    }
    if abs_tick & 0x4 != 0 {
        ratio = (ratio * U256::from_dec_str("340214320654664324051920982716015181260").unwrap()) >> 128;
    }
    if abs_tick & 0x8 != 0 {
        ratio = (ratio * U256::from_dec_str("340146287995602323631171512101879684304").unwrap()) >> 128;
    }
    if abs_tick & 0x10 != 0 {
        ratio = (ratio * U256::from_dec_str("340010263488231146823593991679159461444").unwrap()) >> 128;
    }
    if abs_tick & 0x20 != 0 {
        ratio = (ratio * U256::from_dec_str("339738377640345403697157401104375502016").unwrap()) >> 128;
    }
    if abs_tick & 0x40 != 0 {
        ratio = (ratio * U256::from_dec_str("339195258003219555707034227454543997025").unwrap()) >> 128;
    }
    if abs_tick & 0x80 != 0 {
        ratio = (ratio * U256::from_dec_str("338111622100601834656805679988414885971").unwrap()) >> 128;
    }
    if abs_tick & 0x100 != 0 {
        ratio = (ratio * U256::from_dec_str("335954724994790223023589805789778977700").unwrap()) >> 128;
    }
    if abs_tick & 0x200 != 0 {
        ratio = (ratio * U256::from_dec_str("331682121138379247127172139078559817300").unwrap()) >> 128;
    }
    if abs_tick & 0x400 != 0 {
        ratio = (ratio * U256::from_dec_str("323299236684853023288211250268160618739").unwrap()) >> 128;
    }
    if abs_tick & 0x800 != 0 {
        ratio = (ratio * U256::from_dec_str("307163716377032989948697243942600083929").unwrap()) >> 128;
    }
    if abs_tick & 0x1000 != 0 {
        ratio = (ratio * U256::from_dec_str("277268403626896220162999269216087595045").unwrap()) >> 128;
    }
    if abs_tick & 0x2000 != 0 {
        ratio = (ratio * U256::from_dec_str("225923453940442621947126027127485391333").unwrap()) >> 128;
    }
    if abs_tick & 0x4000 != 0 {
        ratio = (ratio * U256::from_dec_str("149997214084966997727330242082538205943").unwrap()) >> 128;
    }
    if abs_tick & 0x8000 != 0 {
        ratio = (ratio * U256::from_dec_str("66119101136024775622716233608466517926").unwrap()) >> 128;
    }
    if abs_tick & 0x10000 != 0 {
        ratio = (ratio * U256::from_dec_str("12847376061809297530290974190478138313").unwrap()) >> 128;
    }
    if abs_tick & 0x20000 != 0 {
        ratio = (ratio * U256::from_dec_str("485053260817066172746253684029974020").unwrap()) >> 128;
    }
    if abs_tick & 0x40000 != 0 {
        ratio = (ratio * U256::from_dec_str("691415978906521570653435304214168").unwrap()) >> 128;
    }
    if abs_tick & 0x80000 != 0 {
        ratio = (ratio * U256::from_dec_str("1404880482679654955896180642").unwrap()) >> 128;
    }

    if tick > 0 {
        ratio = U256::MAX / ratio;
    }

    // This divides by 1<<64 rounding up to go from a Q128.128 to a Q128.64
    let prod = (ratio >> 64) + if ratio % (U256::from(1) << 64) == U256::zero() { U256::zero() } else { U256::one() };

    if prod > U256::from(UINT128_MAX) {
        return u128::MAX;
    }

    prod.as_u128()
}

/// Get tick at sqrt ratio - O(1) algorithm matching JS TickMath::getTickAtSqrtRatio
pub fn get_tick_at_sqrt_ratio(sqrt_price_x64: u128) -> i32 {
    if sqrt_price_x64 < MIN_SQRT_RATIO {
        return MIN_TICK;
    }
    if sqrt_price_x64 >= MAX_SQRT_RATIO {
        return MAX_TICK - 1;
    }

    // sqrtRatioX128 = sqrtRatioX64 << 64
    let sqrt_ratio_x128 = U256::from(sqrt_price_x64) << 64;

    let msb = most_significant_bit(sqrt_ratio_x128);

    // Normalize r to [2^127, 2^128)
    let r = if msb >= 128 {
        sqrt_ratio_x128 >> (msb - 127)
    } else {
        sqrt_ratio_x128 << (127 - msb)
    };

    // log_2 = (msb - 128) << 64 as signed 256-bit integer
    // We'll use i128 for intermediate calculations since msb is at most 191
    let mut log_2: i128 = ((msb as i128) - 128) << 64;

    // 14 iterations of binary approximation for log_2
    // Each iteration: r = r^2 >> 127, f = r >> 128, log_2 |= f << (63-i), r >>= f
    let mut r = r;

    for i in 0..14 {
        r = (r * r) >> 127;
        let f = r >> 128;
        let f_val = f.as_u64();
        log_2 |= (f_val as i128) << (63 - i);
        r = r >> (f_val as u32);
    }

    // log_sqrt10001 = log_2 * 255738958999603826347141
    // This is a 256-bit multiplication, but we can use i128 approximation
    // since the final result fits in i32
    let log_sqrt10001_multiplier: i128 = 255738958999603826347141;

    // For proper 256-bit multiplication, we need to handle this carefully
    // log_2 is at most ~127 bits, multiplier is ~78 bits, result is ~205 bits
    // We need to right-shift by 128 to get the tick

    // Use U256 for the multiplication to avoid overflow
    let log_2_abs = log_2.unsigned_abs();
    let log_2_negative = log_2 < 0;

    let log_2_u256 = U256::from(log_2_abs);
    let multiplier_u256 = U256::from(log_sqrt10001_multiplier as u128);
    let log_sqrt10001_abs = log_2_u256 * multiplier_u256;

    // Calculate tick_low and tick_high
    // tick_low = (log_sqrt10001 - 3402992956809132418596140100660247210) >> 128
    // tick_high = (log_sqrt10001 + 291339464771989622907027621153398088495) >> 128

    let offset1 = U256::from_dec_str("3402992956809132418596140100660247210").unwrap();
    let offset2 = U256::from_dec_str("291339464771989622907027621153398088495").unwrap();

    let (tick_low, tick_high) = if log_2_negative {
        // log_sqrt10001 is negative
        // tick_low = (-|log_sqrt10001| - offset1) >> 128 = -(|log_sqrt10001| + offset1) >> 128
        // tick_high = (-|log_sqrt10001| + offset2) >> 128

        let sum_for_low = log_sqrt10001_abs + offset1;
        let tick_low_abs = (sum_for_low >> 128).as_u128() as i64;
        let tick_low = -(tick_low_abs as i32) - 1; // -1 for ceiling in negative direction

        let tick_high = if log_sqrt10001_abs > offset2 {
            let diff = log_sqrt10001_abs - offset2;
            let tick_high_abs = (diff >> 128).as_u128() as i64;
            -(tick_high_abs as i32) - 1
        } else {
            let diff = offset2 - log_sqrt10001_abs;
            let tick_high_val = (diff >> 128).as_u128() as i64;
            tick_high_val as i32
        };

        (tick_low, tick_high)
    } else {
        // log_sqrt10001 is positive
        // tick_low = (log_sqrt10001 - offset1) >> 128
        // tick_high = (log_sqrt10001 + offset2) >> 128

        let tick_low = if log_sqrt10001_abs > offset1 {
            let diff = log_sqrt10001_abs - offset1;
            (diff >> 128).as_u128() as i32
        } else {
            let diff = offset1 - log_sqrt10001_abs;
            let tick_low_abs = (diff >> 128).as_u128() as i64;
            -(tick_low_abs as i32) - 1
        };

        let sum_for_high = log_sqrt10001_abs + offset2;
        let tick_high = (sum_for_high >> 128).as_u128() as i32;

        (tick_low, tick_high)
    };

    if tick_low == tick_high {
        tick_low
    } else if get_sqrt_ratio_at_tick(tick_high) <= sqrt_price_x64 {
        tick_high
    } else {
        tick_low
    }
}

// Helper function to find most significant bit
fn most_significant_bit(x: U256) -> u32 {
    let mut msb = 0;
    let mut val = x;

    if val >= U256::from(1) << 128 {
        val >>= 128;
        msb += 128;
    }
    if val >= U256::from(1) << 64 {
        val >>= 64;
        msb += 64;
    }
    if val >= U256::from(1) << 32 {
        val >>= 32;
        msb += 32;
    }
    if val >= U256::from(1) << 16 {
        val >>= 16;
        msb += 16;
    }
    if val >= U256::from(1) << 8 {
        val >>= 8;
        msb += 8;
    }
    if val >= U256::from(1) << 4 {
        val >>= 4;
        msb += 4;
    }
    if val >= U256::from(1) << 2 {
        val >>= 2;
        msb += 2;
    }
    if val >= U256::from(1) << 1 {
        msb += 1;
    }

    msb
}

/// Full multiplication and division - matching C++ FullMath
fn mul_div(a: u128, b: u128, denominator: u128) -> u128 {
    if denominator == 0 {
        return 0;
    }
    let product = U256::from(a) * U256::from(b);
    (product / U256::from(denominator)).as_u128()
}

fn mul_div_rounding_up(a: u128, b: u128, denominator: u128) -> u128 {
    if denominator == 0 {
        return 0;
    }
    let product = U256::from(a) * U256::from(b);
    let result = product / U256::from(denominator);
    if product % U256::from(denominator) > U256::zero() {
        (result + U256::one()).as_u128()
    } else {
        result.as_u128()
    }
}

fn div_rounding_up(numerator: u128, denominator: u128) -> u128 {
    if denominator == 0 {
        return 0;
    }
    let result = numerator / denominator;
    if numerator % denominator > 0 {
        result + 1
    } else {
        result
    }
}

/// Get amount A delta - matching C++ SqrtPriceMath::getAmountADelta
/// FIXED: liquidity is now u128 instead of u64, returns u128 instead of u64
pub fn get_amount_a_delta(
    sqrt_ratio_l_x64: u128,
    sqrt_ratio_u_x64: u128,
    liquidity: u128,
    round_up: bool,
) -> u128 {
    let (lower, upper) = if sqrt_ratio_l_x64 > sqrt_ratio_u_x64 {
        (sqrt_ratio_u_x64, sqrt_ratio_l_x64)
    } else {
        (sqrt_ratio_l_x64, sqrt_ratio_u_x64)
    };

    if lower == 0 || liquidity == 0 {
        return 0;
    }

    let numerator2 = upper.saturating_sub(lower);
    if numerator2 == 0 {
        return 0;
    }

    // numerator1 = liquidity << 64
    // We need U256 for this multiplication
    let numerator1 = U256::from(liquidity) << FIXED_POINT_64;
    let numerator2_u256 = U256::from(numerator2);
    let upper_u256 = U256::from(upper);
    let lower_u256 = U256::from(lower);

    let amount_a = if round_up {
        // (numerator1 * numerator2 / upper + (lower - 1)) / lower (rounding up)
        let product = numerator1 * numerator2_u256;
        let div1 = product / upper_u256;
        let remainder1 = product % upper_u256;
        let div1_up = if remainder1 > U256::zero() { div1 + U256::one() } else { div1 };
        let div2 = div1_up / lower_u256;
        let remainder2 = div1_up % lower_u256;
        if remainder2 > U256::zero() { div2 + U256::one() } else { div2 }
    } else {
        let product = numerator1 * numerator2_u256;
        (product / upper_u256) / lower_u256
    };

    amount_a.as_u128()
}

/// Get amount B delta - matching C++ SqrtPriceMath::getAmountBDelta
/// FIXED: liquidity is now u128 instead of u64, returns u128 instead of u64
pub fn get_amount_b_delta(
    sqrt_ratio_l_x64: u128,
    sqrt_ratio_u_x64: u128,
    liquidity: u128,
    round_up: bool,
) -> u128 {
    let (lower, upper) = if sqrt_ratio_l_x64 > sqrt_ratio_u_x64 {
        (sqrt_ratio_u_x64, sqrt_ratio_l_x64)
    } else {
        (sqrt_ratio_l_x64, sqrt_ratio_u_x64)
    };

    let diff = upper.saturating_sub(lower);
    if diff == 0 || liquidity == 0 {
        return 0;
    }

    let amount_b = if round_up {
        mul_div_rounding_up(liquidity, diff, Q64)
    } else {
        mul_div(liquidity, diff, Q64)
    };

    amount_b
}

/// Get next sqrt price from amount A - matching C++ SqrtPriceMath::getNextSqrtPriceFromAmountARoundingUp
/// FIXED: liquidity and amount are now u128 instead of u64
fn get_next_sqrt_price_from_amount_a_rounding_up(
    sqrt_px64: u128,
    liquidity: u128,
    amount: u128,
    add: bool,
) -> u128 {
    if amount == 0 || liquidity == 0 {
        return sqrt_px64;
    }

    // numerator1 = liquidity << 64
    let numerator1 = U256::from(liquidity) << FIXED_POINT_64;

    if add {
        let product = U256::from(amount) * U256::from(sqrt_px64);
        let denominator = numerator1 + product;
        if denominator > U256::zero() && denominator >= numerator1 {
            // mul_div_rounding_up(numerator1, sqrt_px64, denominator)
            let product2 = numerator1 * U256::from(sqrt_px64);
            let result = product2 / denominator;
            let remainder = product2 % denominator;
            return if remainder > U256::zero() {
                (result + U256::one()).as_u128()
            } else {
                result.as_u128()
            };
        }
        if sqrt_px64 > 0 {
            // div_rounding_up(numerator1, numerator1 / sqrt_px64 + amount)
            let div_part = numerator1 / U256::from(sqrt_px64);
            let denom = div_part + U256::from(amount);
            let result = numerator1 / denom;
            let remainder = numerator1 % denom;
            return if remainder > U256::zero() {
                (result + U256::one()).as_u128()
            } else {
                result.as_u128()
            };
        }
        u128::MAX
    } else {
        let product = U256::from(amount) * U256::from(sqrt_px64);
        // C++ contract would revert if numerator1 <= product
        // Return current price (no change) instead of invalid value
        if numerator1 <= product {
            return sqrt_px64;
        }
        let denominator = numerator1 - product;
        // mul_div_rounding_up(numerator1, sqrt_px64, denominator)
        let product2 = numerator1 * U256::from(sqrt_px64);
        let result = product2 / denominator;
        let remainder = product2 % denominator;
        if remainder > U256::zero() {
            (result + U256::one()).as_u128()
        } else {
            result.as_u128()
        }
    }
}

/// Get next sqrt price from amount B - matching C++ SqrtPriceMath::getNextSqrtPriceFromAmountBRoundingDown
/// FIXED: liquidity and amount are now u128 instead of u64
fn get_next_sqrt_price_from_amount_b_rounding_down(
    sqrt_px64: u128,
    liquidity: u128,
    amount: u128,
    add: bool,
) -> u128 {
    if liquidity == 0 {
        return sqrt_px64;
    }

    if add {
        let quotient = mul_div(amount, Q64, liquidity);
        sqrt_px64.saturating_add(quotient)
    } else {
        let quotient = mul_div_rounding_up(amount, Q64, liquidity);
        // C++ contract would revert if sqrt_px64 <= quotient
        // Return current price (no change) instead of invalid value
        if sqrt_px64 <= quotient {
            return sqrt_px64;
        }
        sqrt_px64 - quotient
    }
}

/// Get next sqrt price from input - matching C++ SqrtPriceMath::getNextSqrtPriceFromInput
/// FIXED: liquidity and amount_in are now u128 instead of u64
fn get_next_sqrt_price_from_input(
    sqrt_px64: u128,
    liquidity: u128,
    amount_in: u128,
    a_for_b: bool,
) -> u128 {
    if sqrt_px64 == 0 || liquidity == 0 {
        return sqrt_px64;
    }

    if a_for_b {
        get_next_sqrt_price_from_amount_a_rounding_up(sqrt_px64, liquidity, amount_in, true)
    } else {
        get_next_sqrt_price_from_amount_b_rounding_down(sqrt_px64, liquidity, amount_in, true)
    }
}

/// Get next sqrt price from output - matching C++ SqrtPriceMath::getNextSqrtPriceFromOutput
/// FIXED: liquidity and amount_out are now u128 instead of u64
fn get_next_sqrt_price_from_output(
    sqrt_px64: u128,
    liquidity: u128,
    amount_out: u128,
    a_for_b: bool,
) -> u128 {
    if sqrt_px64 == 0 || liquidity == 0 {
        return sqrt_px64;
    }

    if a_for_b {
        get_next_sqrt_price_from_amount_b_rounding_down(sqrt_px64, liquidity, amount_out, false)
    } else {
        get_next_sqrt_price_from_amount_a_rounding_up(sqrt_px64, liquidity, amount_out, false)
    }
}

/// Compute swap step - matching C++ SwapMath::computeSwapStep exactly
/// FIXED: liquidity is now u128 instead of u64, amount_remaining is now i128 instead of i64
/// Returns (sqrt_price_next, amount_in, amount_out, fee_amount) all as u128
pub fn compute_swap_step(
    sqrt_ratio_current_x64: u128,
    sqrt_ratio_target_x64: u128,
    liquidity: u128,
    amount_remaining: i128,
    fee_pips: u32,
) -> (u128, u128, u128, u128) {
    // Add safety checks
    if liquidity == 0 {
        return (sqrt_ratio_current_x64, 0, 0, 0);
    }

    let mut sqrt_ratio_next_x64 = 0u128;
    let mut amount_in = 0u128;
    let mut amount_out = 0u128;
    let mut fee_amount = 0u128;

    let a_for_b = sqrt_ratio_current_x64 >= sqrt_ratio_target_x64;
    let exact_in = amount_remaining >= 0;

    if exact_in {
        let amount_remaining_less_fee = if fee_pips > 0 {
            mul_div(
                amount_remaining.unsigned_abs(),
                (BAR_FEE - fee_pips) as u128,
                BAR_FEE as u128
            )
        } else {
            amount_remaining.unsigned_abs()
        };

        amount_in = if a_for_b {
            get_amount_a_delta(sqrt_ratio_target_x64, sqrt_ratio_current_x64, liquidity, true)
        } else {
            get_amount_b_delta(sqrt_ratio_current_x64, sqrt_ratio_target_x64, liquidity, true)
        };

        if amount_remaining_less_fee >= amount_in {
            sqrt_ratio_next_x64 = sqrt_ratio_target_x64;
        } else {
            sqrt_ratio_next_x64 = get_next_sqrt_price_from_input(
                sqrt_ratio_current_x64,
                liquidity,
                amount_remaining_less_fee,
                a_for_b
            );
        }
    } else {
        amount_out = if a_for_b {
            get_amount_b_delta(sqrt_ratio_target_x64, sqrt_ratio_current_x64, liquidity, false)
        } else {
            get_amount_a_delta(sqrt_ratio_current_x64, sqrt_ratio_target_x64, liquidity, false)
        };

        if amount_remaining.unsigned_abs() >= amount_out {
            sqrt_ratio_next_x64 = sqrt_ratio_target_x64;
        } else {
            sqrt_ratio_next_x64 = get_next_sqrt_price_from_output(
                sqrt_ratio_current_x64,
                liquidity,
                amount_remaining.unsigned_abs(),
                a_for_b
            );
        }
    }

    let max = sqrt_ratio_target_x64 == sqrt_ratio_next_x64;

    // Get the input/output amounts
    if a_for_b {
        amount_in = if max && exact_in {
            amount_in
        } else {
            get_amount_a_delta(sqrt_ratio_next_x64, sqrt_ratio_current_x64, liquidity, true)
        };

        amount_out = if max && !exact_in {
            amount_out
        } else {
            get_amount_b_delta(sqrt_ratio_next_x64, sqrt_ratio_current_x64, liquidity, false)
        };
    } else {
        amount_in = if max && exact_in {
            amount_in
        } else {
            get_amount_b_delta(sqrt_ratio_current_x64, sqrt_ratio_next_x64, liquidity, true)
        };

        amount_out = if max && !exact_in {
            amount_out
        } else {
            get_amount_a_delta(sqrt_ratio_current_x64, sqrt_ratio_next_x64, liquidity, false)
        };
    }

    // Cap the output amount to not exceed the remaining output amount
    if !exact_in && amount_out > amount_remaining.unsigned_abs() {
        amount_out = amount_remaining.unsigned_abs();
    }

    if exact_in && sqrt_ratio_next_x64 != sqrt_ratio_target_x64 {
        // We didn't reach the target, so take the remainder of the maximum input as fee
        fee_amount = amount_remaining.unsigned_abs().saturating_sub(amount_in);
    } else {
        fee_amount = mul_div_rounding_up(
            amount_in,
            fee_pips as u128,
            (BAR_FEE - fee_pips) as u128
        );
    }

    (sqrt_ratio_next_x64, amount_in, amount_out, fee_amount)
}
