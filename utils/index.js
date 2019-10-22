import { Serialize } from 'eosjs'
import Big from 'big.js'


const PRICE_SCALE = 100000000
const PRICE_DIGITS = PRICE_SCALE.toString().length - 1


export function amountToFloat(amount, precision) {
  let scale = new Big(10).pow(precision);
  let prefix = Big(amount).div(scale);

  return Number.parseFloat(prefix).toFixed(precision);
}


export function assetToAmount(amount, precision) {
  let scale = new Big(10).pow(precision);

  return parseInt(new Big(amount).times(scale));
}

export function calculatePrice(sell, buy) {
  let first = parseAsset(buy)
  let second = parseAsset(sell)

  if (second.symbol == 'EOS' && sell.contract == 'eosio.token')
    // EOS main token as main in price
    [first, second] = [second, first]
    
  let k = 1 / first.amount
  let first_price = (second.amount * k).toFixed(4)

  return `1 ${first.symbol} / ${first_price} ${second.symbol}`
}

export function parseExtendedAsset(asset) {
  let symbol = Serialize.stringToSymbol(asset.symbol)


  return {
    contract: asset.contract,
    symbol: symbol,

    str: symbol.name + '@' + asset.contract
  }
}


export function parseAsset(asset) {
  if (asset.hasOwnProperty('symbol')) return asset

  let [amount, symbol] = asset.split(' ')
  let precision = amount.split('.')[1] ? amount.split('.')[1].length : 0

  let scale = new Big(10).pow(precision);
  amount = parseInt(new Big(amount).times(scale));

  return {
    symbol: {
      symbol,
      precision
    },

    amount,

    get prefix () {
        let scale = new Big(10).pow(this.symbol.precision);
        let prefix = Big(this.amount).div(scale);

        return amountToFloat(this.amount, this.symbol.precision);
    },

    get quantity () {
        return this.prefix + " " + this.symbol.symbol
    }
  }
}
