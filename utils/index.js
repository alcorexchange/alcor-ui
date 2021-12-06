import { Name, SymbolCode } from 'eos-common'
import { Serialize } from 'eosjs'
import { Big } from 'big.js'

import config from '../config'

const types = Serialize.createInitialTypes()

export const isToday = (someDate) => {
  const today = new Date()
  return someDate.getDate() == today.getDate() &&
    someDate.getMonth() == today.getMonth() &&
    someDate.getFullYear() == today.getFullYear()
}

export const nameToUint64 = (name) => {
  const ser = new Serialize.SerialBuffer()
  ser.pushName(name)
  return types.get('uint64').deserialize(ser)
}

export const uint64ToName = (num) => {
  const ser = new Serialize.SerialBuffer()
  types.get('uint64').serialize(ser, num)
  return ser.getName()
}

export function make256key(contract1, symbol1, contract2, symbol2) {
  const q_i128_id = new Name(contract1).value.shiftLeft(64).or(new SymbolCode(symbol1.toUpperCase()).raw())
  const b_i128_id = new Name(contract2).value.shiftLeft(64).or(new SymbolCode(symbol2.toUpperCase()).raw())

  if (q_i128_id < b_i128_id)
    return q_i128_id.shiftLeft(128).or(b_i128_id).toString(16)
  else
    return b_i128_id.shiftLeft(128).or(q_i128_id).toString(16)
}

export function e_asset_to_token(easset) {
  return {
    contract: easset.contract,
    symbol: easset.quantity.symbol.code().to_string(),
    precision: easset.quantity.symbol.precision()
  }
}

export function littleEndianToDesimal(string) {
  if (typeof string === 'string' && string.startsWith('0x')) {
    const boundary = string.length / 2
    const lengthMinusTwo = string.length - 2
    const littleEndian = []

    for (let i = 0; i < boundary; i++) {
      const readIndex = lengthMinusTwo - 2 * i
      littleEndian[i] = string.substring(readIndex, readIndex + 2)
    }

    const bigEndian = littleEndian.join('').substring(0, lengthMinusTwo)

    return parseInt(bigEndian, 16)
  }

  return string
}

export const sort_by_price = (a, b) => {
  a = parseInt(a.unit_price)
  b = parseInt(b.unit_price)
  return (a < b) ? 1 : ((b < a) ? -1 : 0)
}

export function quantityToAmount(asset) {
  const amount = asset.split(' ')[0]
  const precision = amount.split('.')[1] ? amount.split('.')[1].length : 0

  const scale = new Big(10).pow(precision)

  return parseInt(new Big(amount).times(scale))
}

// FIXED decimal
//export function amountToFloat(amount, precision) {
//  const str_amount = amount.toString()
//
//  if (precision == 0) return str_amount
//
//  const int_part = str_amount.substring(0, str_amount.length - precision)
//  const decimal_part = str_amount.substring(int_part.length)
//
//  return `${int_part}.${decimal_part}`
//}

export function amountToFloat(amount, precision) {
  const str_amount = amount.toString()

  if (precision == 0) return str_amount

  const int_part = str_amount.substring(0, str_amount.length - precision) || '0'
  let decimal_part = str_amount.substring(int_part.length)

  if (precision >= str_amount.length) {
    decimal_part = '0'.repeat(Math.abs(str_amount.length - precision)) + str_amount
  }

  return `${int_part}.${decimal_part}`
}

export function assetToAmount(amount, precision) {
  const scale = new Big(10).pow(precision)

  return new Big(parseFloat(amount)).times(scale)
}

export function calculatePrice(sell, buy) {
  let first = parseOtcAsset(buy)
  let second = parseOtcAsset(sell)

  if (second.symbol === 'EOS' && sell.contract === 'eosio.token')
    // EOS main token as main in price
    [first, second] = [second, first]

  const price = (first.amount / second.amount).toFixed(config.PRICE_DIGITS)

  return `${price} ${first.symbol}`
}

export function parseExtendedAsset(asset) {
  // New cdt 1.7.0 braking change
  const sym = asset.symbol != undefined ? asset.symbol : asset.sym

  const symbol = Serialize.stringToSymbol(sym)

  return {
    contract: asset.contract,
    symbol,

    str: symbol.name + '@' + asset.contract
  }
}

export function parseAsset(asset) {
  if (Object.prototype.hasOwnProperty.call(asset, 'symbol')) return asset

  const [amount, symbol] = asset.split(' ')
  const precision = amount.split('.')[1] ? amount.split('.')[1].length : 0

  const scale = new Big(10).pow(precision)

  return {
    symbol: {
      symbol,
      precision
    },

    amount: parseInt(new Big(amount).times(scale)),

    get prefix () {
      return amountToFloat(this.amount, this.symbol.precision)
    },

    get quantity () {
      return this.prefix + ' ' + this.symbol.symbol
    }
  }
}

export function prepareOrder(order) {
  order.ask = parseAsset(order.ask)
  order.bid = parseAsset(order.bid)
}

export function parseOtcAsset(asset) {
  if (Object.prototype.hasOwnProperty.call(asset, 'symbol')) return asset

  const paths = asset.quantity.split(' ')
  return {
    symbol: paths[1],
    contract: asset.contract,
    amount: parseFloat(paths[0]),

    get str() {
      return `${this.symbol}@${this.contract}`
    },

    get quantity () {
      // TODO Precision
      return this.amount.toFixed(4) + ' ' + this.symbol
    }
  }
}

export function numberWithCommas(x) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

export function prepareNFT(nfts) {
  // Parse nft of nfts
  if (nfts.length == undefined) {
    nfts = [nfts]
  }

  nfts.map(nft => {
    try {
      nft.mdata = JSON.parse(nft.mdata)
    } catch {}

    try {
      nft.idata = JSON.parse(nft.idata)
    } catch {}

    if (nft.mdata.img) {
      if (nft.mdata.img.startsWith('Qm')) {
        nft.mdata.img = 'https://ipfs.io/ipfs/' + nft.mdata.img
      }

      nft.mdata.img = 'https://images.hive.blog/0x0/' + nft.mdata.img
    }
  })
}

export function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

export function mergeSamePriceOrders(ords) {
  const orders = {}

  for (const o of ords) {
    const order = orders[o.unit_price]

    if (!order) {
      // TODO More elegant way to do that. (it thanges store and buggy increase orders amounts)
      orders[o.unit_price] = JSON.parse(JSON.stringify(o))
    } else {
      order.ask.amount += o.ask.amount
      order.bid.amount += o.bid.amount
      order.myOrder = o.myOrder
    }
  }

  return Object.values(orders).sort(sort_by_price)
}

export function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]]
  }
}
