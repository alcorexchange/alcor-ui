"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.encodeSqrtRatioX64 = void 0;
const jsbi_1 = __importDefault(require("jsbi"));
const _1 = require(".");
/**
 * Returns the sqrt ratio as a Q64.64 corresponding to a given ratio of amountB and amountA
 * @param amountB The numerator amount i.e., the amount of tokenB
 * @param amountA The denominator amount i.e., the amount of tokenA
 * @returns The sqrt ratio
 */
function encodeSqrtRatioX64(amountB, amountA) {
    const numerator = jsbi_1.default.leftShift(jsbi_1.default.BigInt(amountB), jsbi_1.default.BigInt(128));
    const denominator = jsbi_1.default.BigInt(amountA);
    const ratioX128 = jsbi_1.default.divide(numerator, denominator);
    return (0, _1.sqrt)(ratioX128);
}
exports.encodeSqrtRatioX64 = encodeSqrtRatioX64;
