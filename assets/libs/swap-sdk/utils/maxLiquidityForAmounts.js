"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.maxLiquidityForAmounts = void 0;
const jsbi_1 = __importDefault(require("jsbi"));
const internalConstants_1 = require("../internalConstants");
/**
 * Returns an imprecise maximum amount of liquidity received for a given amount of token 0.
 * This function is available to accommodate LiquidityAmounts#getLiquidityForAmountA in the v3 periphery,
 * which could be more precise by at least 32 bits by dividing by Q64 instead of Q64 in the intermediate step,
 * and shifting the subtracted ratio left by 32 bits. This imprecise calculation will likely be replaced in a future
 * v3 router contract.
 * @param sqrtRatioLX64 The price at the lower boundary
 * @param sqrtRatioUX64 The price at the upper boundary
 * @param amountA The token0 amount
 * @returns liquidity for amountA, imprecise
 */
function maxLiquidityForAmountAImprecise(sqrtRatioLX64, sqrtRatioUX64, amountA) {
    if (jsbi_1.default.greaterThan(sqrtRatioLX64, sqrtRatioUX64)) {
        [sqrtRatioLX64, sqrtRatioUX64] = [sqrtRatioUX64, sqrtRatioLX64];
    }
    const intermediate = jsbi_1.default.divide(jsbi_1.default.multiply(sqrtRatioLX64, sqrtRatioUX64), internalConstants_1.Q64);
    return jsbi_1.default.divide(jsbi_1.default.multiply(jsbi_1.default.BigInt(amountA), intermediate), jsbi_1.default.subtract(sqrtRatioUX64, sqrtRatioLX64));
}
/**
 * Returns a precise maximum amount of liquidity received for a given amount of token 0 by dividing by Q64 instead of Q64 in the intermediate step,
 * and shifting the subtracted ratio left by 32 bits.
 * @param sqrtRatioLX64 The price at the lower boundary
 * @param sqrtRatioUX64 The price at the upper boundary
 * @param amountA The token0 amount
 * @returns liquidity for amountA, precise
 */
function maxLiquidityForAmountAPrecise(sqrtRatioLX64, sqrtRatioUX64, amountA) {
    if (jsbi_1.default.greaterThan(sqrtRatioLX64, sqrtRatioUX64)) {
        [sqrtRatioLX64, sqrtRatioUX64] = [sqrtRatioUX64, sqrtRatioLX64];
    }
    const numerator = jsbi_1.default.multiply(jsbi_1.default.multiply(jsbi_1.default.BigInt(amountA), sqrtRatioLX64), sqrtRatioUX64);
    const denominator = jsbi_1.default.multiply(internalConstants_1.Q64, jsbi_1.default.subtract(sqrtRatioUX64, sqrtRatioLX64));
    return jsbi_1.default.divide(numerator, denominator);
}
/**
 * Computes the maximum amount of liquidity received for a given amount of token1
 * @param sqrtRatioLX64 The price at the lower tick boundary
 * @param sqrtRatioUX64 The price at the upper tick boundary
 * @param amountB The token1 amount
 * @returns liquidity for amountB
 */
function maxLiquidityForAmountB(sqrtRatioLX64, sqrtRatioUX64, amountB) {
    if (jsbi_1.default.greaterThan(sqrtRatioLX64, sqrtRatioUX64)) {
        [sqrtRatioLX64, sqrtRatioUX64] = [sqrtRatioUX64, sqrtRatioLX64];
    }
    return jsbi_1.default.divide(jsbi_1.default.multiply(jsbi_1.default.BigInt(amountB), internalConstants_1.Q64), jsbi_1.default.subtract(sqrtRatioUX64, sqrtRatioLX64));
}
/**
 * Computes the maximum amount of liquidity received for a given amount of token0, token1,
 * and the prices at the tick boundaries.
 * @param sqrtRatioCurrentX64 the current price
 * @param sqrtRatioLX64 price at lower boundary
 * @param sqrtRatioUX64 price at upper boundary
 * @param amountA token0 amount
 * @param amountB token1 amount
 * @param useFullPrecision if false, liquidity will be maximized according to what the router can calculate,
 * not what core can theoretically support
 */
function maxLiquidityForAmounts(sqrtRatioCurrentX64, sqrtRatioLX64, sqrtRatioUX64, amountA, amountB, useFullPrecision) {
    if (jsbi_1.default.greaterThan(sqrtRatioLX64, sqrtRatioUX64)) {
        [sqrtRatioLX64, sqrtRatioUX64] = [sqrtRatioUX64, sqrtRatioLX64];
    }
    const maxLiquidityForAmountA = useFullPrecision
        ? maxLiquidityForAmountAPrecise
        : maxLiquidityForAmountAImprecise;
    if (jsbi_1.default.lessThanOrEqual(sqrtRatioCurrentX64, sqrtRatioLX64)) {
        return maxLiquidityForAmountA(sqrtRatioLX64, sqrtRatioUX64, amountA);
    }
    else if (jsbi_1.default.lessThan(sqrtRatioCurrentX64, sqrtRatioUX64)) {
        const liquidityA = maxLiquidityForAmountA(sqrtRatioCurrentX64, sqrtRatioUX64, amountA);
        const liquidityB = maxLiquidityForAmountB(sqrtRatioLX64, sqrtRatioCurrentX64, amountB);
        return jsbi_1.default.lessThan(liquidityA, liquidityB) ? liquidityA : liquidityB;
    }
    else {
        return maxLiquidityForAmountB(sqrtRatioLX64, sqrtRatioUX64, amountB);
    }
}
exports.maxLiquidityForAmounts = maxLiquidityForAmounts;
