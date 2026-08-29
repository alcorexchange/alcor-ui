import { Action, APIClient, KeyType, PrivateKey, SignedTransaction, Transaction } from '@wireio/sdk-core'

import { wireFetch } from '../chain/wire/transport'

// Signing for a Wire chain. @wireio/sdk-core rather than @wharfkit/antelope
// because Wire keys come in six types and the wallets people actually use here
// hold the two Antelope never had: PUB_ED_ (Solana) and PUB_EM_ (MetaMask).
//
// The transport is the shared one from services/chain/wire — the node listens on
// a port Node's built-in fetch refuses to dial. See that file for the full story.

export type WireSigner = {
  /** ABI-encoded action authorized by `actor@active`. */
  action(account: string, name: string, actor: string, data: any): Promise<any>
  /** Signs and pushes one transaction. Rejects with the node's own error. */
  push(actions: any[]): Promise<any>
  /** Account this public key already authorizes, or undefined when it is new. */
  accountForKey(pubkey: string): Promise<string | undefined>
  /** True when the account exists on chain. */
  accountExists(account: string): Promise<boolean>
}

/** The message inside a node error, instead of `[object Object]`. */
export function reason(error: any): string {
  return (
    error?.response?.json?.error?.details?.[0]?.message ??
    error?.message ??
    String(error)
  )
}

export function createWireSigner(url: string, wif: string): WireSigner {
  const client = new APIClient({ url, fetch: wireFetch })
  const key = PrivateKey.from(wif)
  const abis = new Map<string, any>()

  async function abiFor(account: string) {
    if (!abis.has(account)) abis.set(account, (await client.v1.chain.get_abi(account)).abi)
    return abis.get(account)
  }

  return {
    async action(account, name, actor, data) {
      return Action.from(
        { account, name, authorization: [{ actor, permission: 'active' }], data },
        await abiFor(account)
      )
    },

    async push(actions) {
      const info = await client.v1.chain.get_info()
      const transaction = Transaction.from({ ...info.getTransactionHeader(120), actions })
      const { msgDigest } = transaction.signingDigest(info.chain_id, KeyType.K1)

      return client.v1.chain.push_transaction(
        SignedTransaction.from({ ...transaction, signatures: [key.signDigest(msgDigest)] })
      )
    },

    async accountForKey(pubkey) {
      const { accounts }: any = await client.call({
        path: '/v1/chain/get_accounts_by_authorizers',
        params: { keys: [pubkey] },
      })

      return accounts?.[0]?.account_name?.toString()
    },

    async accountExists(account) {
      try {
        await client.v1.chain.get_account(account)
        return true
      } catch (e) {
        return false
      }
    },
  }
}
