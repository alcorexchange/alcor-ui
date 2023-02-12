"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.nearestUsableTick = void 0;
const tiny_invariant_1 = __importDefault(require("tiny-invariant"));
const tickMath_1 = require("./tickMath");
/**
 * Returns the closest tick that is nearest a given tick and usable for the given tick spacing
 * @param tick the target tick
 * @param tickSpacing the spacing of the pool
 */
function nearestUsableTick(tick, tickSpacing) {
    (0, tiny_invariant_1.default)(Number.isInteger(tick) && Number.isInteger(tickSpacing), "INTEGERS");
    (0, tiny_invariant_1.default)(tickSpacing > 0, "TICK_SPACING");
    (0, tiny_invariant_1.default)(tick >= tickMath_1.TickMath.MIN_TICK && tick <= tickMath_1.TickMath.MAX_TICK, "TICK_BOUND");
    const rounded = Math.round(tick / tickSpacing) * tickSpacing;
    if (rounded < tickMath_1.TickMath.MIN_TICK)
        return rounded + tickSpacing;
    else if (rounded > tickMath_1.TickMath.MAX_TICK)
        return rounded - tickSpacing;
    else
        return rounded;
}
exports.nearestUsableTick = nearestUsableTick;
