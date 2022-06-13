export function normalizeTickerId(ticker_id) {
  return ticker_id.replace(/(.*)-(.*)_(.*)-([A-Za-z0-9.]+)$/,
    (_, a, b, c, d) => {
      a = a.toUpperCase()
      b = b.toLowerCase()
      c = c.toUpperCase()
      d = d.toLowerCase()

      return `${a}-${b}_${c}-${d}`
    })
}
