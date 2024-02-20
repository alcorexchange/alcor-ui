"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TickLibrary = exports.subIn128 = exports.subIn256 = void 0;
const jsbi_1 = __importDefault(require("jsbi"));
const internalConstants_1 = require("../internalConstants");
function subIn256(x, y) {
    const difference = jsbi_1.default.subtract(x, y);
    if (jsbi_1.default.lessThan(difference, internalConstants_1.ZERO)) {
        return jsbi_1.default.add(internalConstants_1.Q256, difference);
    }
    else {
        return difference;
    }
}
exports.subIn256 = subIn256;
function subIn128(x, y) {
    const difference = jsbi_1.default.subtract(x, y);
    if (jsbi_1.default.lessThan(difference, internalConstants_1.ZERO)) {
        return jsbi_1.default.add(internalConstants_1.Q128, difference);
    }
    else {
        return difference;
    }
}
exports.subIn128 = subIn128;
class TickLibrary {
    /**
     * Cannot be constructed.
     */
    constructor() { }
    static getFeeGrowthInside(feeGrowthOutsideLower, feeGrowthOutsideUpper, tickLower, tickUpper, tickCurrent, feeGrowthGlobalAX64, feeGrowthGlobalBX64) {
        let feeGrowthBelowAX64;
        let feeGrowthBelowBX64;
        if (tickCurrent >= tickLower) {
            feeGrowthBelowAX64 = feeGrowthOutsideLower.feeGrowthOutsideAX64;
            feeGrowthBelowBX64 = feeGrowthOutsideLower.feeGrowthOutsideBX64;
        }
        else {
            feeGrowthBelowAX64 = subIn128(feeGrowthGlobalAX64, feeGrowthOutsideLower.feeGrowthOutsideAX64);
            feeGrowthBelowBX64 = subIn128(feeGrowthGlobalBX64, feeGrowthOutsideLower.feeGrowthOutsideBX64);
        }
        let feeGrowthAboveAX64;
        let feeGrowthAboveBX64;
        if (tickCurrent < tickUpper) {
            feeGrowthAboveAX64 = feeGrowthOutsideUpper.feeGrowthOutsideAX64;
            feeGrowthAboveBX64 = feeGrowthOutsideUpper.feeGrowthOutsideBX64;
        }
        else {
            feeGrowthAboveAX64 = subIn128(feeGrowthGlobalAX64, feeGrowthOutsideUpper.feeGrowthOutsideAX64);
            feeGrowthAboveBX64 = subIn128(feeGrowthGlobalBX64, feeGrowthOutsideUpper.feeGrowthOutsideBX64);
        }
        return [
            subIn128(subIn128(feeGrowthGlobalAX64, feeGrowthBelowAX64), feeGrowthAboveAX64),
            subIn128(subIn128(feeGrowthGlobalBX64, feeGrowthBelowBX64), feeGrowthAboveBX64),
        ];
    }
}
exports.TickLibrary = TickLibrary;
