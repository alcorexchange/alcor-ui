"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Token = void 0;
const tiny_invariant_1 = __importDefault(require("tiny-invariant"));
const baseCurrency_1 = require("./baseCurrency");
const eosjs_account_name_1 = require("eosjs-account-name");
const jsbi_1 = __importDefault(require("jsbi"));
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
            return this.symbol.toLowerCase() < other.symbol.toLowerCase();
        }
        else {
            return jsbi_1.default.lessThan(jsbi_1.default.BigInt((0, eosjs_account_name_1.nameToUint64)(this.contract)), jsbi_1.default.BigInt((0, eosjs_account_name_1.nameToUint64)(other.contract)));
        }
    }
}
exports.Token = Token;
