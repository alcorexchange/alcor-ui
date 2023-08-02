"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Fraction = void 0;
const jsbi_1 = __importDefault(require("jsbi"));
const tiny_invariant_1 = __importDefault(require("tiny-invariant"));
const toformat_1 = __importDefault(require("toformat"));
const decimal_js_light_1 = __importDefault(require("decimal.js-light"));
const big_js_1 = __importDefault(require("big.js"));
const internalConstants_1 = require("../../internalConstants");
const Decimal = (0, toformat_1.default)(decimal_js_light_1.default);
const Big = (0, toformat_1.default)(big_js_1.default);
const toSignificantRounding = {
    [internalConstants_1.Rounding.ROUND_DOWN]: Decimal.ROUND_DOWN,
    [internalConstants_1.Rounding.ROUND_HALF_UP]: Decimal.ROUND_HALF_UP,
    [internalConstants_1.Rounding.ROUND_UP]: Decimal.ROUND_UP,
};
// const toFixedRounding = {
//   [Rounding.ROUND_DOWN]: RoundingMode.RoundDown,
//   [Rounding.ROUND_HALF_UP]: RoundingMode.RoundHalfUp,
//   [Rounding.ROUND_UP]: RoundingMode.RoundUp
// }
const toFixedRounding = {
    [internalConstants_1.Rounding.ROUND_DOWN]: 0,
    [internalConstants_1.Rounding.ROUND_HALF_UP]: 1,
    [internalConstants_1.Rounding.ROUND_UP]: 3,
};
class Fraction {
    constructor(numerator, denominator = jsbi_1.default.BigInt(1)) {
        this.numerator = jsbi_1.default.BigInt(numerator);
        this.denominator = jsbi_1.default.BigInt(denominator);
    }
    static tryParseFraction(fractionish) {
        if (fractionish instanceof jsbi_1.default ||
            typeof fractionish === "number" ||
            typeof fractionish === "string")
            return new Fraction(fractionish);
        if ("numerator" in fractionish && "denominator" in fractionish)
            return fractionish;
        throw new Error("Could not parse fraction");
    }
    // performs floor division
    get quotient() {
        return jsbi_1.default.divide(this.numerator, this.denominator);
    }
    // remainder after floor division
    get remainder() {
        return new Fraction(jsbi_1.default.remainder(this.numerator, this.denominator), this.denominator);
    }
    invert() {
        return new Fraction(this.denominator, this.numerator);
    }
    add(other) {
        const otherParsed = Fraction.tryParseFraction(other);
        if (jsbi_1.default.equal(this.denominator, otherParsed.denominator)) {
            return new Fraction(jsbi_1.default.add(this.numerator, otherParsed.numerator), this.denominator);
        }
        return new Fraction(jsbi_1.default.add(jsbi_1.default.multiply(this.numerator, otherParsed.denominator), jsbi_1.default.multiply(otherParsed.numerator, this.denominator)), jsbi_1.default.multiply(this.denominator, otherParsed.denominator));
    }
    subtract(other) {
        const otherParsed = Fraction.tryParseFraction(other);
        if (jsbi_1.default.equal(this.denominator, otherParsed.denominator)) {
            return new Fraction(jsbi_1.default.subtract(this.numerator, otherParsed.numerator), this.denominator);
        }
        return new Fraction(jsbi_1.default.subtract(jsbi_1.default.multiply(this.numerator, otherParsed.denominator), jsbi_1.default.multiply(otherParsed.numerator, this.denominator)), jsbi_1.default.multiply(this.denominator, otherParsed.denominator));
    }
    lessThan(other) {
        const otherParsed = Fraction.tryParseFraction(other);
        return jsbi_1.default.lessThan(jsbi_1.default.multiply(this.numerator, otherParsed.denominator), jsbi_1.default.multiply(otherParsed.numerator, this.denominator));
    }
    equalTo(other) {
        const otherParsed = Fraction.tryParseFraction(other);
        return jsbi_1.default.equal(jsbi_1.default.multiply(this.numerator, otherParsed.denominator), jsbi_1.default.multiply(otherParsed.numerator, this.denominator));
    }
    greaterThan(other) {
        const otherParsed = Fraction.tryParseFraction(other);
        return jsbi_1.default.greaterThan(jsbi_1.default.multiply(this.numerator, otherParsed.denominator), jsbi_1.default.multiply(otherParsed.numerator, this.denominator));
    }
    multiply(other) {
        const otherParsed = Fraction.tryParseFraction(other);
        return new Fraction(jsbi_1.default.multiply(this.numerator, otherParsed.numerator), jsbi_1.default.multiply(this.denominator, otherParsed.denominator));
    }
    divide(other) {
        const otherParsed = Fraction.tryParseFraction(other);
        return new Fraction(jsbi_1.default.multiply(this.numerator, otherParsed.denominator), jsbi_1.default.multiply(this.denominator, otherParsed.numerator));
    }
    toSignificant(significantDigits, format = { groupSeparator: "" }, rounding = internalConstants_1.Rounding.ROUND_HALF_UP) {
        (0, tiny_invariant_1.default)(Number.isInteger(significantDigits), `${significantDigits} is not an integer.`);
        (0, tiny_invariant_1.default)(significantDigits > 0, `${significantDigits} is not positive.`);
        Decimal.set({
            precision: significantDigits + 1,
            rounding: toSignificantRounding[rounding],
        });
        const quotient = new Decimal(this.numerator.toString())
            .div(this.denominator.toString())
            .toSignificantDigits(significantDigits);
        return quotient.toFormat(quotient.decimalPlaces(), format);
    }
    toFixed(decimalPlaces, format = { groupSeparator: "" }, rounding = internalConstants_1.Rounding.ROUND_HALF_UP) {
        (0, tiny_invariant_1.default)(Number.isInteger(decimalPlaces), `${decimalPlaces} is not an integer.`);
        (0, tiny_invariant_1.default)(decimalPlaces >= 0, `${decimalPlaces} is negative.`);
        Big.DP = decimalPlaces;
        Big.RM = toFixedRounding[rounding];
        return new Big(this.numerator.toString())
            .div(this.denominator.toString())
            .toFormat(decimalPlaces, format);
    }
    /**
     * Helper method for converting any super class back to a fraction
     */
    get asFraction() {
        return new Fraction(this.numerator, this.denominator);
    }
}
exports.Fraction = Fraction;
