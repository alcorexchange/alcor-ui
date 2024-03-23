declare global {
  type Network = {
    readonly name: string;
    baseToken: {
      symbol: string,
      contract: string,
      precision: number
    },
    GLOBAL_TOKENS: string[],
    client_nodes: string[],
    USD_TOKEN: string,
  }
}
export {}
