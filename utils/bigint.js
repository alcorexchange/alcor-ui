export function sqrt(value) {
  if (value < 0n) {
    throw new Error('Cannot compute square root of negative number')
  }
  if (value < 2n) {
    return value // Square root of 0 or 1 is the number itself
  }

  let x0 = value
  let x1 = (value >> 1n) + 1n // Right shift is equivalent to dividing by 2, then add 1 to ensure it's not zero

  // Repeat until the new guess is the same as the last guess
  while (x1 < x0) {
    x0 = x1
    x1 = (value / x1 + x1) >> 1n // Average of x1 and value/x1
  }

  return x0
}
