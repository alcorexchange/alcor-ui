"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TICK_SPACINGS = exports.Rounding = exports.FeeAmount = exports.TradeType = exports.MaxUint64 = exports.MaxUint128 = exports.MaxUint256 = exports.Q256 = exports.Q192 = exports.Q128 = exports.Q96 = exports.Q64 = exports.Q32 = exports.ONE = exports.ZERO = exports.NEGATIVE_ONE = void 0;
const jsbi_1 = __importDefault(require("jsbi"));
// constants used internally but not expected to be used externally
exports.NEGATIVE_ONE = jsbi_1.default.BigInt(-1);
exports.ZERO = jsbi_1.default.BigInt(0);
exports.ONE = jsbi_1.default.BigInt(1);
// used in liquidity amount math
exports.Q32 = jsbi_1.default.exponentiate(jsbi_1.default.BigInt(2), jsbi_1.default.BigInt(32));
exports.Q64 = jsbi_1.default.exponentiate(jsbi_1.default.BigInt(2), jsbi_1.default.BigInt(64));
exports.Q96 = jsbi_1.default.exponentiate(jsbi_1.default.BigInt(2), jsbi_1.default.BigInt(96));
exports.Q128 = jsbi_1.default.exponentiate(jsbi_1.default.BigInt(2), jsbi_1.default.BigInt(128));
exports.Q192 = jsbi_1.default.exponentiate(jsbi_1.default.BigInt(2), jsbi_1.default.BigInt(192));
exports.Q256 = jsbi_1.default.exponentiate(jsbi_1.default.BigInt(2), jsbi_1.default.BigInt(256));
exports.MaxUint256 = jsbi_1.default.BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");
exports.MaxUint128 = jsbi_1.default.BigInt("0xffffffffffffffffffffffffffffffff");
exports.MaxUint64 = jsbi_1.default.BigInt("0xffffffffffffffff");
var TradeType;
(function (TradeType) {
    TradeType[TradeType["EXACT_INPUT"] = 0] = "EXACT_INPUT";
    TradeType[TradeType["EXACT_OUTPUT"] = 1] = "EXACT_OUTPUT";
})(TradeType = exports.TradeType || (exports.TradeType = {}));
/**
 * The default factory enabled fee amounts, denominated in hundredths of bips.
 */
var FeeAmount;
(function (FeeAmount) {
    FeeAmount[FeeAmount["LOW"] = 500] = "LOW";
    FeeAmount[FeeAmount["MEDIUM"] = 3000] = "MEDIUM";
    FeeAmount[FeeAmount["HIGH"] = 10000] = "HIGH";
})(FeeAmount = exports.FeeAmount || (exports.FeeAmount = {}));
var Rounding;
(function (Rounding) {
    Rounding[Rounding["ROUND_DOWN"] = 0] = "ROUND_DOWN";
    Rounding[Rounding["ROUND_HALF_UP"] = 1] = "ROUND_HALF_UP";
    Rounding[Rounding["ROUND_UP"] = 2] = "ROUND_UP";
})(Rounding = exports.Rounding || (exports.Rounding = {}));
/**
 * The default factory tick spacings by fee amount.
 */
exports.TICK_SPACINGS = {
    [FeeAmount.LOW]: 10,
    [FeeAmount.MEDIUM]: 60,
    [FeeAmount.HIGH]: 200,
};
// export const TICK_SPACINGS: { [amount in FeeAmount]: number } = {
//   [FeeAmount.LOW]: 4,
//   [FeeAmount.MEDIUM]: 10,
//   [FeeAmount.HIGH]: 50,
// };
