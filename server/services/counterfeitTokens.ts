// Ids of tokens that copy the symbol of a canonical token from another contract,
// e.g. `xusdt-agix` against the canonical `xusdt-xtokens`.
export function findCounterfeitTokenIds(canonicalIds: string[], tokenIds: string[]): string[] {
  const canonical = new Set(canonicalIds)
  const protectedSymbols = new Set(canonicalIds.map(id => id.split('-')[0]))

  return tokenIds.filter(id => protectedSymbols.has(id.split('-')[0]) && !canonical.has(id))
}
