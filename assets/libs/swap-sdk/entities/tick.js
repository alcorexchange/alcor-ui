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
    constructor({ index, liquidityGross, liquidityNet }) {
        (0, tiny_invariant_1.default)(index >= utils_1.TickMath.MIN_TICK && index <= utils_1.TickMath.MAX_TICK, "TICK");
        this.index = index;
        this.liquidityGross = jsbi_1.default.BigInt(liquidityGross);
        this.liquidityNet = jsbi_1.default.BigInt(liquidityNet);
    }
}
exports.Tick = Tick;
