"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.priceToClosestTick = exports.tickToPrice = void 0;
const price_1 = require("../entities/fractions/price");
const jsbi_1 = __importDefault(require("jsbi"));
const internalConstants_1 = require("../internalConstants");
const encodeSqrtRatioX64_1 = require("./encodeSqrtRatioX64");
const tickMath_1 = require("./tickMath");
/**
 * Returns a price object corresponding to the input tick and the base/quote token
 * Inputs must be tokens because the address order is used to interpret the price represented by the tick
 * @param baseToken the base token of the price
 * @param quoteToken the quote token of the price
 * @param tick the tick for which to return the price
 */
function tickToPrice(baseToken, quoteToken, tick) {
    const sqrtRatioX64 = tickMath_1.TickMath.getSqrtRatioAtTick(tick);
    const ratioX128 = jsbi_1.default.multiply(sqrtRatioX64, sqrtRatioX64);
    return baseToken.sortsBefore(quoteToken)
        ? new price_1.Price(baseToken, quoteToken, internalConstants_1.Q128, ratioX128)
        : new price_1.Price(baseToken, quoteToken, ratioX128, internalConstants_1.Q128);
}
exports.tickToPrice = tickToPrice;
/**
 * Returns the first tick for which the given price is greater than or equal to the tick price
 * @param price for which to return the closest tick that represents a price less than or equal to the input price,
 * i.e. the price of the returned tick is less than or equal to the input price
 */
function priceToClosestTick(price) {
    const sorted = price.baseCurrency.sortsBefore(price.quoteCurrency);
    const sqrtRatioX64 = sorted
        ? (0, encodeSqrtRatioX64_1.encodeSqrtRatioX64)(price.numerator, price.denominator)
        : (0, encodeSqrtRatioX64_1.encodeSqrtRatioX64)(price.denominator, price.numerator);
    let tick = tickMath_1.TickMath.getTickAtSqrtRatio(sqrtRatioX64);
    const nextTickPrice = tickToPrice(price.baseCurrency, price.quoteCurrency, tick + 1);
    if (sorted) {
        if (!price.lessThan(nextTickPrice)) {
            tick++;
        }
    }
    else {
        if (!price.greaterThan(nextTickPrice)) {
            tick++;
        }
    }
    return tick;
}
exports.priceToClosestTick = priceToClosestTick;
