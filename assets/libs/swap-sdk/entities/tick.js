"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Tick = void 0;
const jsbi_1 = __importDefault(require("jsbi"));
const tiny_invariant_1 = __importDefault(require("tiny-invariant"));
const utils_1 = require("../utils");
class Tick {
    constructor({ id, liquidityGross, liquidityNet, feeGrowthOutsideAX64 = 0, feeGrowthOutsideBX64 = 0, tickCumulativeOutside = 0, secondsOutside = 0, secondsPerLiquidityOutsideX64 = 0, }) {
        (0, tiny_invariant_1.default)(id >= utils_1.TickMath.MIN_TICK && id <= utils_1.TickMath.MAX_TICK, "TICK");
        this.id = id;
        this.liquidityGross = jsbi_1.default.BigInt(liquidityGross);
        this.liquidityNet = jsbi_1.default.BigInt(liquidityNet);
        this.feeGrowthOutsideAX64 = jsbi_1.default.BigInt(feeGrowthOutsideAX64);
        this.feeGrowthOutsideBX64 = jsbi_1.default.BigInt(feeGrowthOutsideBX64);
        this.tickCumulativeOutside = jsbi_1.default.BigInt(tickCumulativeOutside);
        this.secondsOutside = jsbi_1.default.BigInt(secondsOutside);
        this.secondsPerLiquidityOutsideX64 = jsbi_1.default.BigInt(secondsPerLiquidityOutsideX64);
    }
}
exports.Tick = Tick;
