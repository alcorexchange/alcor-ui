// Token logos are not endorsements. These specific XPR token identities must
// never inherit branded images from local files, the on-chain registry, or
// third-party token lists. Keep the block scoped to symbol + contract so the
// canonical tokens (for example XBTC@xtokens) remain unaffected.
const SUPPRESSED_PROTON_TOKEN_LOGOS = new Set([
  'xbnb-eosiostokens', 'xbtc-eosiostokens', 'xdoge-eosiostokens',
  'xeth-eosiostokens', 'xsol-eosiostokens', 'xxlm-eosiostokens',
  'xxrp-eosiostokens',
  'loan-xsvnode', 'xmoney-xsvnode', 'xzbcn-xsvnode',
  'xstock-xsvnode', 'googlex-xsvnode', 'aaplx-xsvnode',
  'qqqx-xsvnode', 'xswap-xsvnode',
  'uni-wrap.xpr', 'sui-wrap.xpr', 'cc-wrap.xpr',
  'icp-wrap.xpr', 'fil-wrap.xpr', 'etc-wrap.xpr',
  'xrplt-xrpledgerpro', 'xpr-xrpledgerpro',
])

export function isSuppressedTokenLogo(network: string, symbol: string, contract: string): boolean {
  return network.toLowerCase() === 'proton' &&
    SUPPRESSED_PROTON_TOKEN_LOGOS.has(`${symbol.toLowerCase()}-${contract.toLowerCase()}`)
}
