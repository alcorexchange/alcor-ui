"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mostSignificantBit = void 0;
const jsbi_1 = __importDefault(require("jsbi"));
const tiny_invariant_1 = __importDefault(require("tiny-invariant"));
const internalConstants_1 = require("../internalConstants");
const TWO = jsbi_1.default.BigInt(2);
const POWERS_OF_2 = [128, 64, 32, 16, 8, 4, 2, 1].map((pow) => [
    pow,
    jsbi_1.default.exponentiate(TWO, jsbi_1.default.BigInt(pow)),
]);
function mostSignificantBit(x) {
    (0, tiny_invariant_1.default)(jsbi_1.default.greaterThan(x, internalConstants_1.ZERO), "ZERO");
    (0, tiny_invariant_1.default)(jsbi_1.default.lessThanOrEqual(x, internalConstants_1.MaxUint256), "MAX");
    let msb = 0;
    for (const [power, min] of POWERS_OF_2) {
        if (jsbi_1.default.greaterThanOrEqual(x, min)) {
            x = jsbi_1.default.signedRightShift(x, jsbi_1.default.BigInt(power));
            msb += power;
        }
    }
    return msb;
}
exports.mostSignificantBit = mostSignificantBit;
