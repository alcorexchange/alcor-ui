"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TickListDataProvider = void 0;
const tickList_1 = require("../utils/tickList");
const tick_1 = require("./tick");
/**
 * A data provider for ticks that is backed by an in-memory array of ticks.
 */
class TickListDataProvider {
    constructor(ticks, tickSpacing) {
        const ticksMapped = ticks.map((t) => t instanceof tick_1.Tick ? t : new tick_1.Tick(t));
        tickList_1.TickList.validateList(ticksMapped, tickSpacing);
        this.ticks = ticksMapped;
    }
    getTick(tick) {
        return __awaiter(this, void 0, void 0, function* () {
            return tickList_1.TickList.getTick(this.ticks, tick);
        });
    }
    nextInitializedTickWithinOneWord(tick, lte, tickSpacing) {
        return __awaiter(this, void 0, void 0, function* () {
            return tickList_1.TickList.nextInitializedTickWithinOneWord(this.ticks, tick, lte, tickSpacing);
        });
    }
}
exports.TickListDataProvider = TickListDataProvider;
