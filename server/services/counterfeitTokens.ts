type TokenRef = { id: string, contract: string }

// Ids of tokens that copy the symbol of a canonical token from another contract,
// e.g. `xusdt-agix` against the canonical `xusdt-xtokens`. Canonical are the listed
// ids plus every token issued by one of the canonical contracts (bridges).
export function findCounterfeitTokenIds(
  canonicalIds: string[],
  canonicalContracts: string[],
  tokens: TokenRef[]
): string[] {
  const contracts = new Set(canonicalContracts)
  const canonical = new Set([...canonicalIds, ...tokens.filter(t => contracts.has(t.contract)).map(t => t.id)])
  const protectedSymbols = new Set([...canonical].map(id => id.split('-')[0]))

  return tokens
    .map(t => t.id)
    .filter(id => protectedSymbols.has(id.split('-')[0]) && !canonical.has(id))
}
