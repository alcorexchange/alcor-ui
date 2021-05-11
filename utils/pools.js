import { asset } from 'eos-common'
import { make256key } from '~/utils'

export function get_all_tokens(pairs) {
  const tokens = []

  pairs.map(p => {
    let token = {
      symbol: p.pool1.quantity.symbol.code().to_string(),
      precision: p.pool1.quantity.symbol.precision(),
      contract: p.pool1.contract
    }

    if (tokens.filter(t => t.contract == token.contract && t.symbol == token.symbol).length == 0) tokens.push(token)

    token = {
      symbol: p.pool2.quantity.symbol.code().to_string(),
      precision: p.pool2.quantity.symbol.precision(),
      contract: p.pool2.contract
    }

    if (tokens.filter(t => t.contract == token.contract && t.symbol == token.symbol).length == 0) tokens.push(token)
  })

  return tokens
}

export function get_second_tokens(pairs, token) {
  const tokens = []

  pairs.map(p => {
    if (p.pool1.contract == token.contract && p.pool1.quantity.symbol.code().to_string() == token.symbol) {
      tokens.push({
        symbol: p.pool2.quantity.symbol.code().to_string(),
        precision: p.pool2.quantity.symbol.precision(),
        contract: p.pool2.contract
      })
    }

    if (p.pool2.contract == token.contract && p.pool2.quantity.symbol.code().to_string() == token.symbol) {
      tokens.push({
        symbol: p.pool1.quantity.symbol.code().to_string(),
        precision: p.pool1.quantity.symbol.precision(),
        contract: p.pool1.contract
      })
    }
  })

  return tokens
}

export function get_amount_out(amount_in, reserve_in, reserve_out, fee = 30) {
  const amount_in_with_fee = amount_in.multiply(10000 - fee)
  const numerator = amount_in_with_fee.multiply(reserve_out)
  const denominator = reserve_in.multiply(10000).add(amount_in_with_fee)

  return numerator.divide(denominator)
}

export function get_amount_in(amount_out, reserve_in, reserve_out, fee = 30) {
  const numerator = reserve_in.multiply(amount_out).multiply(10000)
  const denominator = reserve_out.minus(amount_out).multiply(10000 - fee)
  const amount_in = numerator.divide(denominator).plus(1)

  return amount_in
}

export function quote(amount_a, reserve_a, reserve_b) {
  // TODO Add slippage
  const amount_b = amount_a.multiply(reserve_b).divide(reserve_a)
  return amount_b
}

export function computeForward(x, y, z, fee) {
  const prod = x.multiply(y)
  let tmp, tmp_fee

  if (x > 0) {
    tmp = prod.minus(1).divide(z).plus(1)
    tmp_fee = tmp.multiply(fee).plus(9999).divide(10000)
  } else {
    tmp = prod.divide(z)
    tmp_fee = tmp.multiply(-1).multiply(fee).plus(9999).divide(10000)
  }

  return tmp.plus(tmp_fee)
}

export function computeBackward(x, y, z, fee) {
  const fee_amount = x.multiply(fee).plus(9999).divide(10000)
  x = x.minus(fee_amount)
  x = x.multiply(y).divide(z)

  return x
}

export function calcPrice(a, b) {
  const diff_precision = a.symbol.precision() - b.symbol.precision()

  return (a.amount / b.amount) / (10 ** diff_precision)
}

export function preparePair(pair) {
  // TODO Update this method / optimization
  pair.pool1.quantity = asset(pair.pool1.quantity)
  pair.pool2.quantity = asset(pair.pool2.quantity)
  pair.supply = asset(pair.supply)
  pair.name = pair.pool1.quantity.symbol.code().to_string() + '/' + pair.pool2.quantity.symbol.code().to_string()
  pair.i256 = make256key(
    pair.pool1.contract, pair.pool1.quantity.symbol.code().to_string(),
    pair.pool2.contract, pair.pool2.quantity.symbol.code().to_string()
  )

  return pair
}
