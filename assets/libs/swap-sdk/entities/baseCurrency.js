"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseCurrency = void 0;
const tiny_invariant_1 = __importDefault(require("tiny-invariant"));
/**
 * A currency is any fungible financial instrument, including Ether, all ERC20 tokens, and other chain-native currencies
 */
class BaseCurrency {
    /**
     * Constructs an instance of the base class `BaseCurrency`.
     * @param chainId the chain ID on which this currency resides
     * @param decimals decimals of the currency
     * @param symbol symbol of the currency
     * @param name of the currency
     */
    constructor(contract, decimals, symbol, id) {
        (0, tiny_invariant_1.default)(decimals >= 0 && decimals < 19 && Number.isInteger(decimals), "DECIMALS");
        this.contract = contract;
        this.decimals = decimals;
        this.symbol = symbol;
        this.id = id;
    }
}
exports.BaseCurrency = BaseCurrency;
