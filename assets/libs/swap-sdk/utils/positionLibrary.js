"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PositionLibrary = void 0;
const jsbi_1 = __importDefault(require("jsbi"));
const _1 = require(".");
const internalConstants_1 = require("../internalConstants");
class PositionLibrary {
    /**
     * Cannot be constructed.
     */
    constructor() { }
    // replicates the portions of Position#update required to compute unaccounted fees
    static getTokensOwed(feeGrowthInsideALastX64, feeGrowthInsideBLastX64, liquidity, feeGrowthInsideAX64, feeGrowthInsideBX64) {
        const tokensOwed0 = jsbi_1.default.divide(jsbi_1.default.multiply((0, _1.subIn128)(feeGrowthInsideAX64, feeGrowthInsideALastX64), liquidity), internalConstants_1.Q64);
        const tokensOwed1 = jsbi_1.default.divide(jsbi_1.default.multiply((0, _1.subIn128)(feeGrowthInsideBX64, feeGrowthInsideBLastX64), liquidity), internalConstants_1.Q64);
        return [tokensOwed0, tokensOwed1];
    }
}
exports.PositionLibrary = PositionLibrary;
