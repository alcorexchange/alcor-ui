declare global {
  type Network = {
    name: string
    desc: string
    /** Picks the chain adapter. Absent means a stock Antelope chain. */
    chainType?: 'wire'
    /** Updater services to run for this chain. Absent means all of them. */
    services?: string[]
    /** USD price of the system token when no pool or exchange can supply one. */
    fixedSystemPrice?: number
    /** Where a streamer starts when it has no saved progress. */
    firstBlock?: number | 'head'
    /** Test chains only: what wireFaucetService hands out, and how often. */
    faucet?: {
      issuer: string
      policy: { net: string; cpu: string; ram: string }
      accountsPerIp: number
      funder: string
      drip: { contract: string; quantity: string }[]
      dripsPerAccount: number
      dripsPerIp: number
      windowHours: number
    }
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
    SCAM_TOKENS: string[]
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
