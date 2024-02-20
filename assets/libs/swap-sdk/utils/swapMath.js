"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SwapMath = void 0;
const jsbi_1 = __importDefault(require("jsbi"));
const internalConstants_1 = require("../internalConstants");
const fullMath_1 = require("./fullMath");
const sqrtPriceMath_1 = require("./sqrtPriceMath");
const MAX_FEE = jsbi_1.default.exponentiate(jsbi_1.default.BigInt(10), jsbi_1.default.BigInt(6));
class SwapMath {
    /**
     * Cannot be constructed.
     */
    constructor() { }
    static computeSwapStep(sqrtRatioCurrentX64, sqrtRatioTargetX64, liquidity, amountRemaining, feePips) {
        const returnValues = {};
        const zeroForOne = jsbi_1.default.greaterThanOrEqual(sqrtRatioCurrentX64, sqrtRatioTargetX64);
        const exactIn = jsbi_1.default.greaterThanOrEqual(amountRemaining, internalConstants_1.ZERO);
        if (exactIn) {
            const amountRemainingLessFee = jsbi_1.default.divide(jsbi_1.default.multiply(amountRemaining, jsbi_1.default.subtract(MAX_FEE, jsbi_1.default.BigInt(feePips))), MAX_FEE);
            returnValues.amountIn = zeroForOne
                ? sqrtPriceMath_1.SqrtPriceMath.getAmountADelta(sqrtRatioTargetX64, sqrtRatioCurrentX64, liquidity, true)
                : sqrtPriceMath_1.SqrtPriceMath.getAmountBDelta(sqrtRatioCurrentX64, sqrtRatioTargetX64, liquidity, true);
            if (jsbi_1.default.greaterThanOrEqual(amountRemainingLessFee, returnValues.amountIn)) {
                returnValues.sqrtRatioNextX64 = sqrtRatioTargetX64;
            }
            else {
                returnValues.sqrtRatioNextX64 = sqrtPriceMath_1.SqrtPriceMath.getNextSqrtPriceFromInput(sqrtRatioCurrentX64, liquidity, amountRemainingLessFee, zeroForOne);
            }
        }
        else {
            returnValues.amountOut = zeroForOne
                ? sqrtPriceMath_1.SqrtPriceMath.getAmountBDelta(sqrtRatioTargetX64, sqrtRatioCurrentX64, liquidity, false)
                : sqrtPriceMath_1.SqrtPriceMath.getAmountADelta(sqrtRatioCurrentX64, sqrtRatioTargetX64, liquidity, false);
            if (jsbi_1.default.greaterThanOrEqual(jsbi_1.default.multiply(amountRemaining, internalConstants_1.NEGATIVE_ONE), returnValues.amountOut)) {
                returnValues.sqrtRatioNextX64 = sqrtRatioTargetX64;
            }
            else {
                returnValues.sqrtRatioNextX64 =
                    sqrtPriceMath_1.SqrtPriceMath.getNextSqrtPriceFromOutput(sqrtRatioCurrentX64, liquidity, jsbi_1.default.multiply(amountRemaining, internalConstants_1.NEGATIVE_ONE), zeroForOne);
            }
        }
        const max = jsbi_1.default.equal(sqrtRatioTargetX64, returnValues.sqrtRatioNextX64);
        if (zeroForOne) {
            returnValues.amountIn =
                max && exactIn
                    ? returnValues.amountIn
                    : sqrtPriceMath_1.SqrtPriceMath.getAmountADelta(returnValues.sqrtRatioNextX64, sqrtRatioCurrentX64, liquidity, true);
            returnValues.amountOut =
                max && !exactIn
                    ? returnValues.amountOut
                    : sqrtPriceMath_1.SqrtPriceMath.getAmountBDelta(returnValues.sqrtRatioNextX64, sqrtRatioCurrentX64, liquidity, false);
        }
        else {
            returnValues.amountIn =
                max && exactIn
                    ? returnValues.amountIn
                    : sqrtPriceMath_1.SqrtPriceMath.getAmountBDelta(sqrtRatioCurrentX64, returnValues.sqrtRatioNextX64, liquidity, true);
            returnValues.amountOut =
                max && !exactIn
                    ? returnValues.amountOut
                    : sqrtPriceMath_1.SqrtPriceMath.getAmountADelta(sqrtRatioCurrentX64, returnValues.sqrtRatioNextX64, liquidity, false);
        }
        if (!exactIn &&
            jsbi_1.default.greaterThan(returnValues.amountOut, jsbi_1.default.multiply(amountRemaining, internalConstants_1.NEGATIVE_ONE))) {
            returnValues.amountOut = jsbi_1.default.multiply(amountRemaining, internalConstants_1.NEGATIVE_ONE);
        }
        if (exactIn &&
            jsbi_1.default.notEqual(returnValues.sqrtRatioNextX64, sqrtRatioTargetX64)) {
            // we didn't reach the target, so take the remainder of the maximum input as fee
            returnValues.feeAmount = jsbi_1.default.subtract(amountRemaining, returnValues.amountIn);
        }
        else {
            returnValues.feeAmount = fullMath_1.FullMath.mulDivRoundingUp(returnValues.amountIn, jsbi_1.default.BigInt(feePips), jsbi_1.default.subtract(MAX_FEE, jsbi_1.default.BigInt(feePips)));
        }
        return [
            returnValues.sqrtRatioNextX64,
            returnValues.amountIn,
            returnValues.amountOut,
            returnValues.feeAmount,
        ];
    }
}
exports.SwapMath = SwapMath;
