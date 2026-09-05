export type Balance = {
  contract: string
  currency: string
  amount: string
}

export type ActionCallback = (action: any, network: Network) => Promise<void> | void

/**
 * The four things that differ between a stock Antelope chain and Wire. Everything
 * else — asset strings, account names, scopes, get_table_by_scope, ABIs — is
 * identical, so nothing else belongs behind this interface.
 */
export interface ChainAdapter {
  readonly network: Network

  /** RPC whose get_table_rows returns flat rows, whatever the chain stores underneath. */
  rpc(): any

  /**
   * Follows `account` forever, invoking `callback` for each action named in
   * `names` ('*' matches every action). Never returns; throws only when the
   * stream cannot be resumed at all.
   */
  streamActions(account: string, names: string[], callback: ActionCallback, delay?: number): Promise<never>

  /**
   * Every token balance held by `account`.
   *
   * `tokenContracts` is a hint for chains with no balance index of their own,
   * where balances have to be read contract by contract. Chains with an external
   * index (light API) ignore it and return everything the account holds.
   */
  getBalances(account: string, tokenContracts: string[]): Promise<Balance[]>

  /** USD price of the chain's system token, or 0 when it cannot be established. */
  getSystemUsdPrice(): Promise<number>
}
