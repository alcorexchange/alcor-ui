"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Token = void 0;
const tiny_invariant_1 = __importDefault(require("tiny-invariant"));
const baseCurrency_1 = require("./baseCurrency");
const eos_common_1 = require("eos-common");
/**
 * Represents an ERC20 token with a unique address and some metadata.
 */
class Token extends baseCurrency_1.BaseCurrency {
    /**
     * @param contract {@link BaseCurrency#contract}
     * @param decimals {@link BaseCurrency#decimals}
     * @param symbol {@link BaseCurrency#symbol}
     * @param id {@link BaseCurrency#id}
     */
    constructor(contract, decimals, symbol, id) {
        super(contract, decimals, symbol, id);
    }
    get name() {
        console.warn('Token.name is deprecated, use token.id');
        return this.symbol.toLowerCase() + '-' + this.contract;
    }
    /**
     * Returns true if the two tokens are equivalent, i.e. have the same contract and symbol.
     * @param other other token to compare
     */
    equals(other) {
        return (this.contract === other.contract &&
            this.symbol === other.symbol &&
            this.decimals === other.decimals);
    }
    /**
     * Returns true if the address of this token sorts before the address of the other token
     * @param other other token to compare
     * @throws if the tokens have the same contract and symbol
     */
    sortsBefore(other) {
        if (this.contract === other.contract) {
            (0, tiny_invariant_1.default)(this.symbol !== other.symbol, "SYMBOLS");
            const token0Symbol = (0, eos_common_1.symbol)(this.symbol, this.decimals);
            const token1Symbol = (0, eos_common_1.symbol)(other.symbol, other.decimals);
            return token0Symbol.raw().lt(token1Symbol.raw());
        }
        else {
            return (0, eos_common_1.name)(this.contract).raw().lt((0, eos_common_1.name)(other.contract).raw());
        }
    }
}
exports.Token = Token;
