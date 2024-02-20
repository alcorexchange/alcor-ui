"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TickList = void 0;
const jsbi_1 = __importDefault(require("jsbi"));
const tiny_invariant_1 = __importDefault(require("tiny-invariant"));
const internalConstants_1 = require("../internalConstants");
const isSorted_1 = require("./isSorted");
function tickComparator(a, b) {
    return a.id - b.id;
}
/**x
 * Utility methods for interacting with sorted lists of ticks
 */
class TickList {
    /**
     * Cannot be constructed
     */
    constructor() { }
    static validateList(ticks, tickSpacing) {
        (0, tiny_invariant_1.default)(tickSpacing > 0, "TICK_SPACING_NONZERO");
        // ensure ticks are spaced appropriately
        (0, tiny_invariant_1.default)(ticks.every(({ id }) => id % tickSpacing === 0), "TICK_SPACING");
        // ensure tick liquidity deltas sum to 0
        (0, tiny_invariant_1.default)(jsbi_1.default.equal(ticks.reduce((accumulator, { liquidityNet }) => jsbi_1.default.add(accumulator, liquidityNet), internalConstants_1.ZERO), internalConstants_1.ZERO), "ZERO_NET");
        (0, tiny_invariant_1.default)((0, isSorted_1.isSorted)(ticks, tickComparator), "SORTED");
    }
    static isBelowSmallest(ticks, tick) {
        (0, tiny_invariant_1.default)(ticks.length > 0, "LENGTH");
        return tick < ticks[0].id;
    }
    static isAtOrAboveLargest(ticks, tick) {
        (0, tiny_invariant_1.default)(ticks.length > 0, "LENGTH");
        return tick >= ticks[ticks.length - 1].id;
    }
    static getTick(ticks, id) {
        const tick = ticks[this.binarySearch(ticks, id)];
        (0, tiny_invariant_1.default)(tick.id === id, "NOT_CONTAINED");
        return tick;
    }
    /**
     * Finds the largest tick in the list of ticks that is less than or equal to tick
     * @param ticks list of ticks
     * @param tick tick to find the largest tick that is less than or equal to tick
     * @private
     */
    static binarySearch(ticks, tick) {
        (0, tiny_invariant_1.default)(!this.isBelowSmallest(ticks, tick), "BELOW_SMALLEST");
        let l = 0;
        let r = ticks.length - 1;
        let i;
        while (true) {
            i = Math.floor((l + r) / 2);
            if (ticks[i].id <= tick &&
                (i === ticks.length - 1 || ticks[i + 1].id > tick)) {
                return i;
            }
            if (ticks[i].id < tick) {
                l = i + 1;
            }
            else {
                r = i - 1;
            }
        }
    }
    static nextInitializedTick(ticks, tick, lte) {
        if (lte) {
            (0, tiny_invariant_1.default)(!TickList.isBelowSmallest(ticks, tick), "BELOW_SMALLEST");
            if (TickList.isAtOrAboveLargest(ticks, tick)) {
                return ticks[ticks.length - 1];
            }
            const id = this.binarySearch(ticks, tick);
            return ticks[id];
        }
        else {
            (0, tiny_invariant_1.default)(!this.isAtOrAboveLargest(ticks, tick), "AT_OR_ABOVE_LARGEST");
            if (this.isBelowSmallest(ticks, tick)) {
                return ticks[0];
            }
            const id = this.binarySearch(ticks, tick);
            return ticks[id + 1];
        }
    }
    static nextInitializedTickWithinOneWord(ticks, tick, lte, tickSpacing) {
        const compressed = Math.floor(tick / tickSpacing); // matches rounding in the code
        if (lte) {
            const wordPos = compressed >> 7;
            const minimum = (wordPos << 7) * tickSpacing;
            if (TickList.isBelowSmallest(ticks, tick)) {
                return [minimum, false];
            }
            const id = TickList.nextInitializedTick(ticks, tick, lte).id;
            const nextInitializedTick = Math.max(minimum, id);
            return [nextInitializedTick, nextInitializedTick === id];
        }
        else {
            const wordPos = (compressed + 1) >> 7;
            const maximum = (((wordPos + 1) << 7) - 1) * tickSpacing;
            if (this.isAtOrAboveLargest(ticks, tick)) {
                return [maximum, false];
            }
            const id = this.nextInitializedTick(ticks, tick, lte).id;
            const nextInitializedTick = Math.min(maximum, id);
            return [nextInitializedTick, nextInitializedTick === id];
        }
    }
}
exports.TickList = TickList;
