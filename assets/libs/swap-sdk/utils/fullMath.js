"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FullMath = void 0;
const jsbi_1 = __importDefault(require("jsbi"));
const internalConstants_1 = require("../internalConstants");
class FullMath {
    /**
     * Cannot be constructed.
     */
    constructor() { }
    static mulDivRoundingUp(a, b, denominator) {
        const product = jsbi_1.default.multiply(a, b);
        let result = jsbi_1.default.divide(product, denominator);
        if (jsbi_1.default.notEqual(jsbi_1.default.remainder(product, denominator), internalConstants_1.ZERO))
            result = jsbi_1.default.add(result, internalConstants_1.ONE);
        return result;
    }
}
exports.FullMath = FullMath;
