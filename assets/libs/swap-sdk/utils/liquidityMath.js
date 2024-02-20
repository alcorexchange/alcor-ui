"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LiquidityMath = void 0;
const jsbi_1 = __importDefault(require("jsbi"));
const internalConstants_1 = require("../internalConstants");
class LiquidityMath {
    /**
     * Cannot be constructed.
     */
    constructor() { }
    static addDelta(x, y) {
        if (jsbi_1.default.lessThan(y, internalConstants_1.ZERO)) {
            return jsbi_1.default.subtract(x, jsbi_1.default.multiply(y, internalConstants_1.NEGATIVE_ONE));
        }
        else {
            return jsbi_1.default.add(x, y);
        }
    }
}
exports.LiquidityMath = LiquidityMath;
