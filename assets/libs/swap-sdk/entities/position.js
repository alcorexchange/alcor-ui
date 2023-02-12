"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Position = void 0;
const fractions_1 = require("./fractions");
const internalConstants_1 = require("../internalConstants");
const jsbi_1 = __importDefault(require("jsbi"));
const tiny_invariant_1 = __importDefault(require("tiny-invariant"));
const internalConstants_2 = require("../internalConstants");
const maxLiquidityForAmounts_1 = require("../utils/maxLiquidityForAmounts");
const priceTickConversions_1 = require("../utils/priceTickConversions");
const sqrtPriceMath_1 = require("../utils/sqrtPriceMath");
const tickMath_1 = require("../utils/tickMath");
const encodeSqrtRatioX64_1 = require("../utils/encodeSqrtRatioX64");
const pool_1 = require("./pool");
/**
 * Represents a position on a Uniswap V3 Pool
 */
class Position {
    /**
     * Constructs a position for a given pool with the given liquidity
     * @param pool For which pool the liquidity is assigned
     * @param liquidity The amount of liquidity that is in the position
     * @param tickLower The lower tick of the position
     * @param tickUpper The upper tick of the position
     */
    constructor({ pool, liquidity, tickLower, tickUpper, }) {
        // cached resuts for the getters
        this._tokenAAmount = null;
        this._tokenBAmount = null;
        this._mintAmounts = null;
        (0, tiny_invariant_1.default)(tickLower < tickUpper, "TICK_ORDER");
        (0, tiny_invariant_1.default)(tickLower >= tickMath_1.TickMath.MIN_TICK && tickLower % pool.tickSpacing === 0, "TICK_LOWER");
        (0, tiny_invariant_1.default)(tickUpper <= tickMath_1.TickMath.MAX_TICK && tickUpper % pool.tickSpacing === 0, "TICK_UPPER");
        this.pool = pool;
        this.tickLower = tickLower;
        this.tickUpper = tickUpper;
        this.liquidity = jsbi_1.default.BigInt(liquidity);
    }
    /**
     * Returns the price of tokenA at the lower tick
     */
    get tokenAPriceLower() {
        return (0, priceTickConversions_1.tickToPrice)(this.pool.tokenA, this.pool.tokenB, this.tickLower);
    }
    /**
     * Returns the price of tokenA at the upper tick
     */
    get tokenAPriceUpper() {
        return (0, priceTickConversions_1.tickToPrice)(this.pool.tokenA, this.pool.tokenB, this.tickUpper);
    }
    /**
     * Returns the amount of tokenA that this position's liquidity could be burned for at the current pool price
     */
    get amountA() {
        if (this._tokenAAmount === null) {
            if (this.pool.tickCurrent < this.tickLower) {
                this._tokenAAmount = fractions_1.CurrencyAmount.fromRawAmount(this.pool.tokenA, sqrtPriceMath_1.SqrtPriceMath.getAmountADelta(tickMath_1.TickMath.getSqrtRatioAtTick(this.tickLower), tickMath_1.TickMath.getSqrtRatioAtTick(this.tickUpper), this.liquidity, false));
            }
            else if (this.pool.tickCurrent < this.tickUpper) {
                this._tokenAAmount = fractions_1.CurrencyAmount.fromRawAmount(this.pool.tokenA, sqrtPriceMath_1.SqrtPriceMath.getAmountADelta(this.pool.sqrtRatioX64, tickMath_1.TickMath.getSqrtRatioAtTick(this.tickUpper), this.liquidity, false));
            }
            else {
                this._tokenAAmount = fractions_1.CurrencyAmount.fromRawAmount(this.pool.tokenA, internalConstants_2.ZERO);
            }
        }
        return this._tokenAAmount;
    }
    /**
     * Returns the amount of tokenB that this position's liquidity could be burned for at the current pool price
     */
    get amountB() {
        if (this._tokenBAmount === null) {
            if (this.pool.tickCurrent < this.tickLower) {
                this._tokenBAmount = fractions_1.CurrencyAmount.fromRawAmount(this.pool.tokenB, internalConstants_2.ZERO);
            }
            else if (this.pool.tickCurrent < this.tickUpper) {
                this._tokenBAmount = fractions_1.CurrencyAmount.fromRawAmount(this.pool.tokenB, sqrtPriceMath_1.SqrtPriceMath.getAmountBDelta(tickMath_1.TickMath.getSqrtRatioAtTick(this.tickLower), this.pool.sqrtRatioX64, this.liquidity, false));
            }
            else {
                this._tokenBAmount = fractions_1.CurrencyAmount.fromRawAmount(this.pool.tokenB, sqrtPriceMath_1.SqrtPriceMath.getAmountBDelta(tickMath_1.TickMath.getSqrtRatioAtTick(this.tickLower), tickMath_1.TickMath.getSqrtRatioAtTick(this.tickUpper), this.liquidity, false));
            }
        }
        return this._tokenBAmount;
    }
    /**
     * Returns the lower and upper sqrt ratios if the price 'slips' up to slippage tolerance percentage
     * @param slippageTolerance The amount by which the price can 'slip' before the transaction will revert
     * @returns The sqrt ratios after slippage
     */
    ratiosAfterSlippage(slippageTolerance) {
        const priceLower = this.pool.tokenAPrice.asFraction.multiply(new fractions_1.Percent(1).subtract(slippageTolerance));
        const priceUpper = this.pool.tokenAPrice.asFraction.multiply(slippageTolerance.add(1));
        let sqrtRatioX64Lower = (0, encodeSqrtRatioX64_1.encodeSqrtRatioX64)(priceLower.numerator, priceLower.denominator);
        if (jsbi_1.default.lessThanOrEqual(sqrtRatioX64Lower, tickMath_1.TickMath.MIN_SQRT_RATIO)) {
            sqrtRatioX64Lower = jsbi_1.default.add(tickMath_1.TickMath.MIN_SQRT_RATIO, jsbi_1.default.BigInt(1));
        }
        let sqrtRatioX64Upper = (0, encodeSqrtRatioX64_1.encodeSqrtRatioX64)(priceUpper.numerator, priceUpper.denominator);
        if (jsbi_1.default.greaterThanOrEqual(sqrtRatioX64Upper, tickMath_1.TickMath.MAX_SQRT_RATIO)) {
            sqrtRatioX64Upper = jsbi_1.default.subtract(tickMath_1.TickMath.MAX_SQRT_RATIO, jsbi_1.default.BigInt(1));
        }
        return {
            sqrtRatioX64Lower,
            sqrtRatioX64Upper,
        };
    }
    /**
     * Returns the minimum amounts that must be sent in order to safely mint the amount of liquidity held by the position
     * with the given slippage tolerance
     * @param slippageTolerance Tolerance of unfavorable slippage from the current price
     * @returns The amounts, with slippage
     */
    mintAmountsWithSlippage(slippageTolerance) {
        // get lower/upper prices
        const { sqrtRatioX64Upper, sqrtRatioX64Lower } = this.ratiosAfterSlippage(slippageTolerance);
        // construct counterfactual pools
        const poolLower = new pool_1.Pool(this.pool.tokenA, this.pool.tokenB, this.pool.fee, sqrtRatioX64Lower, 0 /* liquidity doesn't matter */, tickMath_1.TickMath.getTickAtSqrtRatio(sqrtRatioX64Lower));
        const poolUpper = new pool_1.Pool(this.pool.tokenA, this.pool.tokenB, this.pool.fee, sqrtRatioX64Upper, 0 /* liquidity doesn't matter */, tickMath_1.TickMath.getTickAtSqrtRatio(sqrtRatioX64Upper));
        // because the router is imprecise, we need to calculate the position that will be created (assuming no slippage)
        const positionThatWillBeCreated = Position.fromAmounts(Object.assign(Object.assign({ pool: this.pool, tickLower: this.tickLower, tickUpper: this.tickUpper }, this.mintAmounts), { useFullPrecision: false }));
        // we want the smaller amounts...
        // ...which occurs at the upper price for amountA...
        const { amountA } = new Position({
            pool: poolUpper,
            liquidity: positionThatWillBeCreated.liquidity,
            tickLower: this.tickLower,
            tickUpper: this.tickUpper,
        }).mintAmounts;
        // ...and the lower for amountB
        const { amountB } = new Position({
            pool: poolLower,
            liquidity: positionThatWillBeCreated.liquidity,
            tickLower: this.tickLower,
            tickUpper: this.tickUpper,
        }).mintAmounts;
        return { amountA, amountB };
    }
    /**
     * Returns the minimum amounts that should be requested in order to safely burn the amount of liquidity held by the
     * position with the given slippage tolerance
     * @param slippageTolerance tolerance of unfavorable slippage from the current price
     * @returns The amounts, with slippage
     */
    burnAmountsWithSlippage(slippageTolerance) {
        // get lower/upper prices
        const { sqrtRatioX64Upper, sqrtRatioX64Lower } = this.ratiosAfterSlippage(slippageTolerance);
        // construct counterfactual pools
        const poolLower = new pool_1.Pool(this.pool.tokenA, this.pool.tokenB, this.pool.fee, sqrtRatioX64Lower, 0 /* liquidity doesn't matter */, tickMath_1.TickMath.getTickAtSqrtRatio(sqrtRatioX64Lower));
        const poolUpper = new pool_1.Pool(this.pool.tokenA, this.pool.tokenB, this.pool.fee, sqrtRatioX64Upper, 0 /* liquidity doesn't matter */, tickMath_1.TickMath.getTickAtSqrtRatio(sqrtRatioX64Upper));
        // we want the smaller amounts...
        // ...which occurs at the upper price for amountA...
        const amountA = new Position({
            pool: poolUpper,
            liquidity: this.liquidity,
            tickLower: this.tickLower,
            tickUpper: this.tickUpper,
        }).amountA;
        // ...and the lower for amountB
        const amountB = new Position({
            pool: poolLower,
            liquidity: this.liquidity,
            tickLower: this.tickLower,
            tickUpper: this.tickUpper,
        }).amountB;
        return { amountA: amountA.quotient, amountB: amountB.quotient };
    }
    /**
     * Returns the minimum amounts that must be sent in order to mint the amount of liquidity held by the position at
     * the current price for the pool
     */
    get mintAmounts() {
        if (this._mintAmounts === null) {
            if (this.pool.tickCurrent < this.tickLower) {
                return {
                    amountA: sqrtPriceMath_1.SqrtPriceMath.getAmountADelta(tickMath_1.TickMath.getSqrtRatioAtTick(this.tickLower), tickMath_1.TickMath.getSqrtRatioAtTick(this.tickUpper), this.liquidity, true),
                    amountB: internalConstants_2.ZERO,
                };
            }
            else if (this.pool.tickCurrent < this.tickUpper) {
                return {
                    amountA: sqrtPriceMath_1.SqrtPriceMath.getAmountADelta(this.pool.sqrtRatioX64, tickMath_1.TickMath.getSqrtRatioAtTick(this.tickUpper), this.liquidity, true),
                    amountB: sqrtPriceMath_1.SqrtPriceMath.getAmountBDelta(tickMath_1.TickMath.getSqrtRatioAtTick(this.tickLower), this.pool.sqrtRatioX64, this.liquidity, true),
                };
            }
            else {
                return {
                    amountA: internalConstants_2.ZERO,
                    amountB: sqrtPriceMath_1.SqrtPriceMath.getAmountBDelta(tickMath_1.TickMath.getSqrtRatioAtTick(this.tickLower), tickMath_1.TickMath.getSqrtRatioAtTick(this.tickUpper), this.liquidity, true),
                };
            }
        }
        return this._mintAmounts;
    }
    /**
     * Computes the maximum amount of liquidity received for a given amount of tokenA, tokenB,
     * and the prices at the tick boundaries.
     * @param pool The pool for which the position should be created
     * @param tickLower The lower tick of the position
     * @param tickUpper The upper tick of the position
     * @param amountA tokenA amount
     * @param amountB tokenB amount
     * @param useFullPrecision If false, liquidity will be maximized according to what the router can calculate,
     * not what core can theoretically support
     * @returns The amount of liquidity for the position
     */
    static fromAmounts({ pool, tickLower, tickUpper, amountA, amountB, useFullPrecision, }) {
        const sqrtRatioLX64 = tickMath_1.TickMath.getSqrtRatioAtTick(tickLower);
        const sqrtRatioUX64 = tickMath_1.TickMath.getSqrtRatioAtTick(tickUpper);
        return new Position({
            pool,
            tickLower,
            tickUpper,
            liquidity: (0, maxLiquidityForAmounts_1.maxLiquidityForAmounts)(pool.sqrtRatioX64, sqrtRatioLX64, sqrtRatioUX64, amountA, amountB, useFullPrecision),
        });
    }
    /**
     * Computes a position with the maximum amount of liquidity received for a given amount of tokenA, assuming an unlimited amount of tokenB
     * @param pool The pool for which the position is created
     * @param tickLower The lower tick
     * @param tickUpper The upper tick
     * @param amountA The desired amount of tokenA
     * @param useFullPrecision If true, liquidity will be maximized according to what the router can calculate,
     * not what core can theoretically support
     * @returns The position
     */
    static fromAmountA({ pool, tickLower, tickUpper, amountA, useFullPrecision, }) {
        return Position.fromAmounts({
            pool,
            tickLower,
            tickUpper,
            amountA,
            amountB: internalConstants_1.MaxUint256,
            useFullPrecision,
        });
    }
    /**
     * Computes a position with the maximum amount of liquidity received for a given amount of tokenB, assuming an unlimited amount of tokenA
     * @param pool The pool for which the position is created
     * @param tickLower The lower tick
     * @param tickUpper The upper tick
     * @param amountB The desired amount of tokenB
     * @returns The position
     */
    static fromAmountB({ pool, tickLower, tickUpper, amountB, }) {
        // this function always uses full precision,
        return Position.fromAmounts({
            pool,
            tickLower,
            tickUpper,
            amountA: internalConstants_1.MaxUint256,
            amountB,
            useFullPrecision: true,
        });
    }
}
exports.Position = Position;
