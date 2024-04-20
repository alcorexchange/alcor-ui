declare global {
  type Network = {
    name: string
    desc: string
    contract: string
    baseToken: {
      contract: string
      symbol: string
      precision: number
      id: string
    }
    marketCreationFee: string
    feeAccount: string
    chainId: string
    host: string
    port: number
    protocol: string
    monitor: string
    monitor_params: string
    lightapi: string
    hyperion: string
    backEnd: string
    client_nodes: { [key: string]: string }
    otc: {
      contract: string
      divs: string
    }
    pools: {
      contract: string
      fee: string
    }
    amm: {
      contract: string
    }
    ibc: {
      name: string
      returnValueEnabled: boolean
      proofSockets: string[]
      wrapLockContracts: { [key: string]: string[] }
      wrapTokenContracts: { [key: string]: string[] }
    }
    RECOMMENDED_MARKETS: string[]
    PINNED_MARKETS: string[]
    BANNER_MARKETS: string[]
    SCAM_CONTRACTS: string[]
    CEX_CONTRACTS: string[]
    nftMarket: {
      contract: string
    }
    USD_TOKEN: string
    popularTokens: string[]
    GLOBAL_TOKENS: string[]
  }
}
export {}
