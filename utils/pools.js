import { asset } from 'eos-common'

export function get_amount_out(amount_in, reserve_in, reserve_out, fee = 10) {
  const amount_in_with_fee = amount_in.multiply(10000 - fee)
  const numerator = amount_in_with_fee.multiply(reserve_out)
  const denominator = reserve_in.multiply(10000).add(amount_in_with_fee)

  return numerator.divide(denominator)
}

export function get_amount_in(amount_out, reserve_in, reserve_out, fee = 10) {
  // TODO Test it
  const numerator = reserve_in.multiply(amount_out).multiply(10000)
  const denominator = reserve_out.minus(amount_out).multiply(10000 - fee)
  const amount_in = numerator.divide(denominator).plus(1)

  return amount_in
}

export function computeForward(x, y, z, fee) {
  //const tmp = x.multiply(-1).multiply(z).divide(y.plus(x))
  //return tmp.plus(tmp.multiply(-1).multiply(fee).plus(9999).divide(10000)).abs()

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

export function preparePool(pool) {
  pool.pool1.quantity = asset(pool.pool1.quantity)
  pool.pool2.quantity = asset(pool.pool2.quantity)
  pool.supply = asset(pool.supply)

  return pool
}
