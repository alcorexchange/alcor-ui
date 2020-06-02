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
