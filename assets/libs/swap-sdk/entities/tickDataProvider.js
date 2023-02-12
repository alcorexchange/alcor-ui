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
exports.NoTickDataProvider = void 0;
/**
 * This tick data provider does not know how to fetch any tick data. It throws whenever it is required. Useful if you
 * do not need to load tick data for your use case.
 */
class NoTickDataProvider {
    getTick(_tick) {
        return __awaiter(this, void 0, void 0, function* () {
            throw new Error(NoTickDataProvider.ERROR_MESSAGE);
        });
    }
    nextInitializedTickWithinOneWord(_tick, _lte, _tickSpacing) {
        return __awaiter(this, void 0, void 0, function* () {
            throw new Error(NoTickDataProvider.ERROR_MESSAGE);
        });
    }
}
exports.NoTickDataProvider = NoTickDataProvider;
NoTickDataProvider.ERROR_MESSAGE = "No tick data provider was given";
