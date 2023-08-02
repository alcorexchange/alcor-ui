"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SqrtPriceMath = void 0;
const jsbi_1 = __importDefault(require("jsbi"));
const tiny_invariant_1 = __importDefault(require("tiny-invariant"));
const internalConstants_1 = require("../internalConstants");
const fullMath_1 = require("./fullMath");
function multiplyIn128(x, y) {
    const product = jsbi_1.default.multiply(x, y);
    return jsbi_1.default.bitwiseAnd(product, internalConstants_1.MaxUint128);
}
function addIn128(x, y) {
    const sum = jsbi_1.default.add(x, y);
    return jsbi_1.default.bitwiseAnd(sum, internalConstants_1.MaxUint128);
}
class SqrtPriceMath {
    /**
     * Cannot be constructed.
     */
    constructor() { }
    static getAmountADelta(sqrtRatioLX64, sqrtRatioUX64, liquidity, roundUp) {
        if (jsbi_1.default.greaterThan(sqrtRatioLX64, sqrtRatioUX64)) {
            [sqrtRatioLX64, sqrtRatioUX64] = [sqrtRatioUX64, sqrtRatioLX64];
        }
        const numerator1 = jsbi_1.default.leftShift(liquidity, jsbi_1.default.BigInt(64));
        const numerator2 = jsbi_1.default.subtract(sqrtRatioUX64, sqrtRatioLX64);
        return roundUp
            ? fullMath_1.FullMath.mulDivRoundingUp(fullMath_1.FullMath.mulDivRoundingUp(numerator1, numerator2, sqrtRatioUX64), internalConstants_1.ONE, sqrtRatioLX64)
            : jsbi_1.default.divide(jsbi_1.default.divide(jsbi_1.default.multiply(numerator1, numerator2), sqrtRatioUX64), sqrtRatioLX64);
    }
    static getAmountBDelta(sqrtRatioLX64, sqrtRatioUX64, liquidity, roundUp) {
        if (jsbi_1.default.greaterThan(sqrtRatioLX64, sqrtRatioUX64)) {
            [sqrtRatioLX64, sqrtRatioUX64] = [sqrtRatioUX64, sqrtRatioLX64];
        }
        return roundUp
            ? fullMath_1.FullMath.mulDivRoundingUp(liquidity, jsbi_1.default.subtract(sqrtRatioUX64, sqrtRatioLX64), internalConstants_1.Q64)
            : jsbi_1.default.divide(jsbi_1.default.multiply(liquidity, jsbi_1.default.subtract(sqrtRatioUX64, sqrtRatioLX64)), internalConstants_1.Q64);
    }
    static getNextSqrtPriceFromInput(sqrtPX64, liquidity, amountIn, zeroForOne) {
        (0, tiny_invariant_1.default)(jsbi_1.default.greaterThan(sqrtPX64, internalConstants_1.ZERO));
        (0, tiny_invariant_1.default)(jsbi_1.default.greaterThan(liquidity, internalConstants_1.ZERO));
        return zeroForOne
            ? this.getNextSqrtPriceFromAmountARoundingUp(sqrtPX64, liquidity, amountIn, true)
            : this.getNextSqrtPriceFromAmountBRoundingDown(sqrtPX64, liquidity, amountIn, true);
    }
    static getNextSqrtPriceFromOutput(sqrtPX64, liquidity, amountOut, zeroForOne) {
        (0, tiny_invariant_1.default)(jsbi_1.default.greaterThan(sqrtPX64, internalConstants_1.ZERO));
        (0, tiny_invariant_1.default)(jsbi_1.default.greaterThan(liquidity, internalConstants_1.ZERO));
        return zeroForOne
            ? this.getNextSqrtPriceFromAmountBRoundingDown(sqrtPX64, liquidity, amountOut, false)
            : this.getNextSqrtPriceFromAmountARoundingUp(sqrtPX64, liquidity, amountOut, false);
    }
    static getNextSqrtPriceFromAmountARoundingUp(sqrtPX64, liquidity, amount, add) {
        if (jsbi_1.default.equal(amount, internalConstants_1.ZERO))
            return sqrtPX64;
        const numerator1 = jsbi_1.default.leftShift(liquidity, jsbi_1.default.BigInt(64));
        if (add) {
            let product = multiplyIn128(amount, sqrtPX64);
            if (jsbi_1.default.equal(jsbi_1.default.divide(product, amount), sqrtPX64)) {
                const denominator = addIn128(numerator1, product);
                if (jsbi_1.default.greaterThanOrEqual(denominator, numerator1)) {
                    return fullMath_1.FullMath.mulDivRoundingUp(numerator1, sqrtPX64, denominator);
                }
            }
            return fullMath_1.FullMath.mulDivRoundingUp(numerator1, internalConstants_1.ONE, jsbi_1.default.add(jsbi_1.default.divide(numerator1, sqrtPX64), amount));
        }
        else {
            let product = multiplyIn128(amount, sqrtPX64);
            (0, tiny_invariant_1.default)(jsbi_1.default.equal(jsbi_1.default.divide(product, amount), sqrtPX64));
            (0, tiny_invariant_1.default)(jsbi_1.default.greaterThan(numerator1, product));
            const denominator = jsbi_1.default.subtract(numerator1, product);
            return fullMath_1.FullMath.mulDivRoundingUp(numerator1, sqrtPX64, denominator);
        }
    }
    static getNextSqrtPriceFromAmountBRoundingDown(sqrtPX64, liquidity, amount, add) {
        if (add) {
            const quotient = jsbi_1.default.lessThanOrEqual(amount, internalConstants_1.MaxUint128)
                ? jsbi_1.default.divide(jsbi_1.default.leftShift(amount, jsbi_1.default.BigInt(64)), liquidity)
                : jsbi_1.default.divide(jsbi_1.default.multiply(amount, internalConstants_1.Q64), liquidity);
            return jsbi_1.default.add(sqrtPX64, quotient);
        }
        else {
            const quotient = fullMath_1.FullMath.mulDivRoundingUp(amount, internalConstants_1.Q64, liquidity);
            (0, tiny_invariant_1.default)(jsbi_1.default.greaterThan(sqrtPX64, quotient));
            return jsbi_1.default.subtract(sqrtPX64, quotient);
        }
    }
}
exports.SqrtPriceMath = SqrtPriceMath;
