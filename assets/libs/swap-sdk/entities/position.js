"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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
const utils_1 = require("../utils");
class Position {
    /**
     * Constructs a position for a given pool with the given liquidity
     * @param pool For which pool the liquidity is assigned
     * @param liquidity The amount of liquidity that is in the position
     * @param lower The lower tick of the position
     * @param upper The upper tick of the position
     */
    constructor({ id, owner, pool, liquidity, lower, upper, feeGrowthInsideALastX64, feeGrowthInsideBLastX64, }) {
        // cached resuts for the getters
        this._tokenAAmount = null;
        this._tokenBAmount = null;
        this._mintAmounts = null;
        (0, tiny_invariant_1.default)(lower < upper, "TICK_ORDER");
        (0, tiny_invariant_1.default)(lower >= tickMath_1.TickMath.MIN_TICK && lower % pool.tickSpacing === 0, "TICK_LOWER");
        (0, tiny_invariant_1.default)(upper <= tickMath_1.TickMath.MAX_TICK && upper % pool.tickSpacing === 0, "TICK_UPPER");
        this.id = id;
        this.owner = owner;
        this.pool = pool;
        this.lower = lower;
        this.upper = upper;
        this.liquidity = jsbi_1.default.BigInt(liquidity);
        this.feeGrowthInsideALastX64 = jsbi_1.default.BigInt(feeGrowthInsideALastX64);
        this.feeGrowthInsideBLastX64 = jsbi_1.default.BigInt(feeGrowthInsideBLastX64);
    }
    get inRange() {
        return (this.lower < this.pool.tickCurrent &&
            this.pool.tickCurrent < this.upper);
    }
    /**
     * Returns the price of tokenA at the lower tick
     */
    get tokenAPriceLower() {
        return (0, priceTickConversions_1.tickToPrice)(this.pool.tokenA, this.pool.tokenB, this.lower);
    }
    /**
     * Returns the price of tokenA at the upper tick
     */
    get tokenAPriceUpper() {
        return (0, priceTickConversions_1.tickToPrice)(this.pool.tokenA, this.pool.tokenB, this.upper);
    }
    /**
     * Returns the amount of tokenA that this position's liquidity could be burned for at the current pool price
     */
    get amountA() {
        if (this._tokenAAmount === null) {
            if (this.pool.tickCurrent < this.lower) {
                this._tokenAAmount = fractions_1.CurrencyAmount.fromRawAmount(this.pool.tokenA, sqrtPriceMath_1.SqrtPriceMath.getAmountADelta(tickMath_1.TickMath.getSqrtRatioAtTick(this.lower), tickMath_1.TickMath.getSqrtRatioAtTick(this.upper), this.liquidity, false));
            }
            else if (this.pool.tickCurrent < this.upper) {
                this._tokenAAmount = fractions_1.CurrencyAmount.fromRawAmount(this.pool.tokenA, sqrtPriceMath_1.SqrtPriceMath.getAmountADelta(this.pool.sqrtPriceX64, tickMath_1.TickMath.getSqrtRatioAtTick(this.upper), this.liquidity, false));
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
            if (this.pool.tickCurrent < this.lower) {
                this._tokenBAmount = fractions_1.CurrencyAmount.fromRawAmount(this.pool.tokenB, internalConstants_2.ZERO);
            }
            else if (this.pool.tickCurrent < this.upper) {
                this._tokenBAmount = fractions_1.CurrencyAmount.fromRawAmount(this.pool.tokenB, sqrtPriceMath_1.SqrtPriceMath.getAmountBDelta(tickMath_1.TickMath.getSqrtRatioAtTick(this.lower), this.pool.sqrtPriceX64, this.liquidity, false));
            }
            else {
                this._tokenBAmount = fractions_1.CurrencyAmount.fromRawAmount(this.pool.tokenB, sqrtPriceMath_1.SqrtPriceMath.getAmountBDelta(tickMath_1.TickMath.getSqrtRatioAtTick(this.lower), tickMath_1.TickMath.getSqrtRatioAtTick(this.upper), this.liquidity, false));
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
        let sqrtPriceX64Lower = (0, encodeSqrtRatioX64_1.encodeSqrtRatioX64)(priceLower.numerator, priceLower.denominator);
        if (jsbi_1.default.lessThanOrEqual(sqrtPriceX64Lower, tickMath_1.TickMath.MIN_SQRT_RATIO)) {
            sqrtPriceX64Lower = jsbi_1.default.add(tickMath_1.TickMath.MIN_SQRT_RATIO, jsbi_1.default.BigInt(1));
        }
        let sqrtPriceX64Upper = (0, encodeSqrtRatioX64_1.encodeSqrtRatioX64)(priceUpper.numerator, priceUpper.denominator);
        if (jsbi_1.default.greaterThanOrEqual(sqrtPriceX64Upper, tickMath_1.TickMath.MAX_SQRT_RATIO)) {
            sqrtPriceX64Upper = jsbi_1.default.subtract(tickMath_1.TickMath.MAX_SQRT_RATIO, jsbi_1.default.BigInt(1));
        }
        return {
            sqrtPriceX64Lower,
            sqrtPriceX64Upper,
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
        const { sqrtPriceX64Upper, sqrtPriceX64Lower } = this.ratiosAfterSlippage(slippageTolerance);
        // construct counterfactual pools
        const poolLower = new pool_1.Pool({
            id: this.pool.id,
            tokenA: this.pool.tokenA,
            tokenB: this.pool.tokenB,
            fee: this.pool.fee,
            sqrtPriceX64: sqrtPriceX64Lower,
            liquidity: 0 /* liquidity doesn't matter */,
            tickCurrent: tickMath_1.TickMath.getTickAtSqrtRatio(sqrtPriceX64Lower),
            feeGrowthGlobalAX64: this.feeGrowthInsideALastX64,
            feeGrowthGlobalBX64: this.feeGrowthInsideBLastX64,
            ticks: this.pool.tickDataProvider
        });
        const poolUpper = new pool_1.Pool({
            id: this.pool.id,
            tokenA: this.pool.tokenA,
            tokenB: this.pool.tokenB,
            fee: this.pool.fee,
            sqrtPriceX64: sqrtPriceX64Upper,
            liquidity: 0 /* liquidity doesn't matter */,
            tickCurrent: tickMath_1.TickMath.getTickAtSqrtRatio(sqrtPriceX64Upper),
            feeGrowthGlobalAX64: this.feeGrowthInsideALastX64,
            feeGrowthGlobalBX64: this.feeGrowthInsideBLastX64,
            ticks: this.pool.tickDataProvider
        });
        // because the router is imprecise, we need to calculate the position that will be created (assuming no slippage)
        const positionThatWillBeCreated = Position.fromAmounts(Object.assign(Object.assign({ id: this.id, owner: this.owner, pool: this.pool, lower: this.lower, upper: this.upper }, this.mintAmounts), { useFullPrecision: false, feeGrowthInsideALastX64: this.feeGrowthInsideALastX64, feeGrowthInsideBLastX64: this.feeGrowthInsideBLastX64 }));
        // we want the smaller amounts...
        // ...which occurs at the upper price for amountA...
        const { amountA } = new Position({
            id: this.id,
            owner: this.owner,
            pool: poolUpper,
            liquidity: positionThatWillBeCreated.liquidity,
            lower: this.lower,
            upper: this.upper,
            feeGrowthInsideALastX64: this.feeGrowthInsideALastX64,
            feeGrowthInsideBLastX64: this.feeGrowthInsideBLastX64,
        }).mintAmounts;
        // ...and the lower for amountB
        const { amountB } = new Position({
            id: this.id,
            owner: this.owner,
            pool: poolLower,
            liquidity: positionThatWillBeCreated.liquidity,
            lower: this.lower,
            upper: this.upper,
            feeGrowthInsideALastX64: this.feeGrowthInsideALastX64,
            feeGrowthInsideBLastX64: this.feeGrowthInsideBLastX64,
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
        const { sqrtPriceX64Upper, sqrtPriceX64Lower } = this.ratiosAfterSlippage(slippageTolerance);
        // construct counterfactual pools
        const poolLower = new pool_1.Pool({
            id: this.pool.id,
            tokenA: this.pool.tokenA,
            tokenB: this.pool.tokenB,
            fee: this.pool.fee,
            sqrtPriceX64: sqrtPriceX64Lower,
            liquidity: 0 /* liquidity doesn't matter */,
            tickCurrent: tickMath_1.TickMath.getTickAtSqrtRatio(sqrtPriceX64Lower),
            feeGrowthGlobalAX64: this.feeGrowthInsideALastX64,
            feeGrowthGlobalBX64: this.feeGrowthInsideBLastX64,
            ticks: this.pool.tickDataProvider
        });
        const poolUpper = new pool_1.Pool({
            id: this.pool.id,
            tokenA: this.pool.tokenA,
            tokenB: this.pool.tokenB,
            fee: this.pool.fee,
            sqrtPriceX64: sqrtPriceX64Upper,
            liquidity: 0 /* liquidity doesn't matter */,
            tickCurrent: tickMath_1.TickMath.getTickAtSqrtRatio(sqrtPriceX64Upper),
            feeGrowthGlobalAX64: this.feeGrowthInsideALastX64,
            feeGrowthGlobalBX64: this.feeGrowthInsideBLastX64,
            ticks: this.pool.tickDataProvider
        });
        // we want the smaller amounts...
        // ...which occurs at the upper price for amountA...
        const amountA = new Position({
            id: this.id,
            owner: this.owner,
            pool: poolUpper,
            liquidity: this.liquidity,
            lower: this.lower,
            upper: this.upper,
            feeGrowthInsideALastX64: this.feeGrowthInsideALastX64,
            feeGrowthInsideBLastX64: this.feeGrowthInsideBLastX64,
        }).amountA;
        // ...and the lower for amountB
        const amountB = new Position({
            id: this.id,
            owner: this.owner,
            pool: poolLower,
            liquidity: this.liquidity,
            lower: this.lower,
            upper: this.upper,
            feeGrowthInsideALastX64: this.feeGrowthInsideALastX64,
            feeGrowthInsideBLastX64: this.feeGrowthInsideBLastX64,
        }).amountB;
        return { amountA: amountA.quotient, amountB: amountB.quotient };
    }
    /**
     * Returns the minimum amounts that must be sent in order to mint the amount of liquidity held by the position at
     * the current price for the pool
     */
    get mintAmounts() {
        if (this._mintAmounts === null) {
            if (this.pool.tickCurrent < this.lower) {
                return {
                    amountA: sqrtPriceMath_1.SqrtPriceMath.getAmountADelta(tickMath_1.TickMath.getSqrtRatioAtTick(this.lower), tickMath_1.TickMath.getSqrtRatioAtTick(this.upper), this.liquidity, true),
                    amountB: internalConstants_2.ZERO,
                };
            }
            else if (this.pool.tickCurrent < this.upper) {
                return {
                    amountA: sqrtPriceMath_1.SqrtPriceMath.getAmountADelta(this.pool.sqrtPriceX64, tickMath_1.TickMath.getSqrtRatioAtTick(this.upper), this.liquidity, true),
                    amountB: sqrtPriceMath_1.SqrtPriceMath.getAmountBDelta(tickMath_1.TickMath.getSqrtRatioAtTick(this.lower), this.pool.sqrtPriceX64, this.liquidity, true),
                };
            }
            else {
                return {
                    amountA: internalConstants_2.ZERO,
                    amountB: sqrtPriceMath_1.SqrtPriceMath.getAmountBDelta(tickMath_1.TickMath.getSqrtRatioAtTick(this.lower), tickMath_1.TickMath.getSqrtRatioAtTick(this.upper), this.liquidity, true),
                };
            }
        }
        return this._mintAmounts;
    }
    /**
     * Computes the maximum amount of liquidity received for a given amount of tokenA, tokenB,
     * and the prices at the tick boundaries.
     * @param pool The pool for which the position should be created
     * @param lower The lower tick of the position
     * @param upper The upper tick of the position
     * @param amountA tokenA amount
     * @param amountB tokenB amount
     * @param useFullPrecision If false, liquidity will be maximized according to what the router can calculate,
     * not what core can theoretically support
     * @returns The amount of liquidity for the position
     */
    static fromAmounts({ id, owner, pool, lower, upper, amountA, amountB, useFullPrecision, feeGrowthInsideALastX64, feeGrowthInsideBLastX64, }) {
        const sqrtRatioLX64 = tickMath_1.TickMath.getSqrtRatioAtTick(lower);
        const sqrtRatioUX64 = tickMath_1.TickMath.getSqrtRatioAtTick(upper);
        return new Position({
            id,
            owner,
            pool,
            lower,
            upper,
            liquidity: (0, maxLiquidityForAmounts_1.maxLiquidityForAmounts)(pool.sqrtPriceX64, sqrtRatioLX64, sqrtRatioUX64, amountA, amountB, useFullPrecision),
            feeGrowthInsideALastX64,
            feeGrowthInsideBLastX64
        });
    }
    /**
     * Computes a position with the maximum amount of liquidity received for a given amount of tokenA, assuming an unlimited amount of tokenB
     * @param pool The pool for which the position is created
     * @param lower The lower tick
     * @param upper The upper tick
     * @param amountA The desired amount of tokenA
     * @param useFullPrecision If true, liquidity will be maximized according to what the router can calculate,
     * not what core can theoretically support
     * @returns The position
     */
    static fromAmountA({ id, owner, pool, lower, upper, amountA, useFullPrecision, feeGrowthInsideALastX64, feeGrowthInsideBLastX64 }) {
        return Position.fromAmounts({
            id,
            owner,
            pool,
            lower,
            upper,
            amountA,
            amountB: internalConstants_1.MaxUint64,
            useFullPrecision,
            feeGrowthInsideALastX64,
            feeGrowthInsideBLastX64
        });
    }
    /**
     * Computes a position with the maximum amount of liquidity received for a given amount of tokenB, assuming an unlimited amount of tokenA
     * @param pool The pool for which the position is created
     * @param lower The lower tick
     * @param upper The upper tick
     * @param amountB The desired amount of tokenB
     * @returns The position
     */
    static fromAmountB({ id, owner, pool, lower, upper, amountB, feeGrowthInsideALastX64, feeGrowthInsideBLastX64, }) {
        // this function always uses full precision,
        return Position.fromAmounts({
            id,
            owner,
            pool,
            lower,
            upper,
            amountA: internalConstants_1.MaxUint64,
            amountB,
            useFullPrecision: true,
            feeGrowthInsideALastX64,
            feeGrowthInsideBLastX64,
        });
    }
    /**
     * Computes a position fees
     * @returns The position
     */
    getFees() {
        return __awaiter(this, void 0, void 0, function* () {
            const { liquidity, lower, upper, feeGrowthInsideALastX64, feeGrowthInsideBLastX64, pool } = this;
            const tickLower = yield this.pool.tickDataProvider.getTick(lower);
            const tickUpper = yield this.pool.tickDataProvider.getTick(upper);
            const { feeGrowthGlobalAX64, feeGrowthGlobalBX64 } = pool;
            const [feeGrowthInsideAX64, feeGrowthInsideBX64] = utils_1.TickLibrary.getFeeGrowthInside(tickLower, tickUpper, lower, upper, pool.tickCurrent, feeGrowthGlobalAX64, feeGrowthGlobalBX64);
            const tokensOwedA = jsbi_1.default.divide(jsbi_1.default.multiply((0, utils_1.subIn128)(feeGrowthInsideAX64, feeGrowthInsideALastX64), liquidity), internalConstants_1.Q64);
            const tokensOwedB = jsbi_1.default.divide(jsbi_1.default.multiply((0, utils_1.subIn128)(feeGrowthInsideBX64, feeGrowthInsideBLastX64), liquidity), internalConstants_1.Q64);
            return {
                feesA: fractions_1.CurrencyAmount.fromRawAmount(this.pool.tokenA, tokensOwedA),
                feesB: fractions_1.CurrencyAmount.fromRawAmount(this.pool.tokenB, tokensOwedB),
            };
        });
    }
}
exports.Position = Position;
