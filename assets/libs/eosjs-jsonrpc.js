import { base64ToBinary, convertLegacyPublicKeys } from "enf-eosjs/dist/eosjs-numeric"
import { RpcError } from "enf-eosjs/dist/eosjs-rpcerror"

function arrayToHex(data) {
  let result = ""
  for (const x of data) {
    result += ("00" + x.toString(16)).slice(-2)
  }
  return result
}

/** Make RPC calls */
export class JsonRpc {
  maxRetries = 3
  /**
   * @param endpoints
   * @param args
   *    * `fetch`:
   *    * browsers: leave `null` or `undefined`
   *    * node: provide an implementation
   */
  constructor(endpoints, args = {}) {
    endpoints = Array.isArray(endpoints) ? endpoints : [endpoints]
    this.endpoints = endpoints.map(endpoint => endpoint.replace(/\/$/, ""))
    this.maxRetries = this.endpoints.length + this.maxRetries

    if (this.endpoints.length) {
      this.currentEndpoint = this.endpoints[0]
    }

    if (args.fetch) {
      this.fetchBuiltin = args.fetch
    } else {
      this.fetchBuiltin = global.fetch.bind(global)
    }
  }

  fetchWithTimeout(url, options, timeout = 6000) {
    const f = this.fetchBuiltin

    return Promise.race([
      f(url, options),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('timeout(' + timeout + ')')), timeout)
      )
    ])
  }

  nextEndpoint() {
    if (this.endpoints.length) {
      if (this.currentEndpoint) {
        const removed = this.endpoints.shift()
        this.endpoints = this.endpoints.concat(removed || [])
      }

      this.currentEndpoint = this.endpoints[0]
      console.log("Switched to API:", this.currentEndpoint)
    }
  }

  /** Post `body` to `endpoint + path`. Throws detailed error information in `RpcError` when available. */
  async fetch(path, body, currentRetries = 0) {
    let response
    let json
    try {
      response = await this.fetchWithTimeout(this.currentEndpoint + path, {
        body: JSON.stringify(body),
        method: "POST"
      })

      if (path.includes('get_table_rows')) {
        // BIG negative Number FIX
        json = JSON.parse(
          (await response.text()).replace(/:(-?\d{16,}),/g, ': "$1",')
        )
      } else {
        json = await response.json()
      }

      if (json.processed && json.processed.except) {
        throw new RpcError(json)
      }

      // TODO check that logic
      if (json?.error?.name == 'exception') {
        throw new RpcError(json)
      }
    } catch (e) {
      console.log("Error from", this.currentEndpoint, e)

      e.isFetchError = true

      if (this.endpoints.length > 1) {
        this.nextEndpoint()
        if (currentRetries < this.maxRetries) {
          console.log("Retrying at try:", currentRetries)
          return this.fetch(path, body, ++currentRetries)
        } else {
          throw e
        }
      }

      throw e
    }
    if (!response.ok) {
      throw new RpcError(json)
    }
    return json
  }

  /** Raw call to `/v1/chain/get_abi` */
  async get_abi(accountName) {
    return await this.fetch("/v1/chain/get_abi", { account_name: accountName })
  }

  /** Raw call to `/v1/chain/get_account` */
  async get_account(accountName) {
    return await this.fetch("/v1/chain/get_account", {
      account_name: accountName
    })
  }

  /** Raw call to `/v1/chain/get_block_header_state` */
  async get_block_header_state(blockNumOrId) {
    return await this.fetch("/v1/chain/get_block_header_state", {
      block_num_or_id: blockNumOrId
    })
  }

  /** Raw call to `/v1/chain/get_block` */
  async get_block(blockNumOrId) {
    return await this.fetch("/v1/chain/get_block", {
      block_num_or_id: blockNumOrId
    })
  }

  /** Raw call to `/v1/trace_api/get_block` */
  async get_trace_block(block_num) {
    return await this.fetch("/v1/trace_api/get_block", {
      block_num
    })
  }

  /** Raw call to `/v1/chain/get_code` */
  async get_code(accountName) {
    return await this.fetch("/v1/chain/get_code", { account_name: accountName })
  }

  /** Raw call to `/v1/chain/get_currency_balance` */
  async get_currency_balance(code, account, symbol = null) {
    return await this.fetch("/v1/chain/get_currency_balance", {
      code,
      account,
      symbol
    })
  }

  /** Raw call to `/v1/chain/get_currency_stats` */
  async get_currency_stats(code, symbol) {
    return await this.fetch("/v1/chain/get_currency_stats", { code, symbol })
  }

  /** Raw call to `/v1/chain/get_info` */
  async get_info() {
    return await this.fetch("/v1/chain/get_info", {})
  }

  /** Raw call to `/v1/chain/get_producer_schedule` */
  async get_producer_schedule() {
    return await this.fetch("/v1/chain/get_producer_schedule", {})
  }

  /** Raw call to `/v1/chain/get_producers` */
  async get_producers(json = true, lowerBound = "", limit = 50) {
    return await this.fetch("/v1/chain/get_producers", {
      json,
      lower_bound: lowerBound,
      limit
    })
  }

  /** Raw call to `/v1/chain/get_raw_code_and_abi` */
  async get_raw_code_and_abi(accountName) {
    return await this.fetch("/v1/chain/get_raw_code_and_abi", {
      account_name: accountName
    })
  }

  /** calls `/v1/chain/get_raw_code_and_abi` and pulls out unneeded raw wasm code */
  // TODO: use `/v1/chain/get_raw_abi` directly when it becomes available
  async getRawAbi(accountName) {
    const rawCodeAndAbi = await this.get_raw_code_and_abi(accountName)
    const abi = base64ToBinary(rawCodeAndAbi.abi)
    return { accountName: rawCodeAndAbi.account_name, abi }
  }

  /** Raw call to `/v1/chain/get_scheduled_transactions` */
  async get_scheduled_transactions(json = true, lowerBound = "", limit = 50) {
    return await this.fetch("/v1/chain/get_scheduled_transactions", {
      json,
      lower_bound: lowerBound,
      limit
    })
  }

  /** Raw call to `/v1/chain/get_table_rows` */
  async get_table_rows({
    json = true,
    code,
    scope,
    table,
    table_key = "",
    lower_bound = "",
    upper_bound = "",
    index_position = 1,
    key_type = "",
    limit = 10,
    reverse = false,
    show_payer = false
  }) {
    return await this.fetch("/v1/chain/get_table_rows", {
      json,
      code,
      scope,
      table,
      table_key,
      lower_bound,
      upper_bound,
      index_position,
      key_type,
      limit,
      reverse,
      show_payer
    })
  }

  /** Raw call to `/v1/chain/get_table_by_scope` */
  async get_table_by_scope({
    code,
    table,
    lower_bound = "",
    upper_bound = "",
    limit = 10
  }) {
    return await this.fetch("/v1/chain/get_table_by_scope", {
      code,
      table,
      lower_bound,
      upper_bound,
      limit
    })
  }

  /** Get subset of `availableKeys` needed to meet authorities in `transaction`. Implements `AuthorityProvider` */
  async getRequiredKeys(args) {
    return convertLegacyPublicKeys(
      (
        await this.fetch("/v1/chain/get_required_keys", {
          transaction: args.transaction,
          available_keys: args.availableKeys
        })
      ).required_keys
    )
  }

  /** Push a serialized transaction (replaced by send_transaction, but returned format has changed) */
  async push_transaction({
    signatures,
    serializedTransaction,
    serializedContextFreeData
  }) {
    try {
      return await this.fetch("/v1/chain/push_transaction", {
        signatures,
        compression: 0,
        packed_context_free_data: arrayToHex(
          serializedContextFreeData || new Uint8Array(0)
        ),
        packed_trx: arrayToHex(serializedTransaction)
      })
    } catch (e) {
      const expired = e.json.error.name === "expired_tx_exception"
      if (expired) {
        e.json.error.message = "Transaction Expired: Try Again"
        this.nextEndpoint()
      }
      throw e
    }
  }

  /** Send a serialized transaction */
  async send_transaction({
    signatures,
    serializedTransaction,
    serializedContextFreeData
  }) {
    return await this.fetch("/v1/chain/send_transaction", {
      signatures,
      compression: 0,
      packed_context_free_data: arrayToHex(
        serializedContextFreeData || new Uint8Array(0)
      ),
      packed_trx: arrayToHex(serializedTransaction)
    })
  }

  /** Send a serialized transaction2 */
  async send_transaction2({
    return_failure_trace,
    retry_trx,
    retry_trx_num_blocks,
    transaction: {
      signatures,
      serializedTransaction,
      serializedContextFreeData
    }
  }) {
    return await this.fetch("/v1/chain/send_transaction2", {
      return_failure_trace,
      retry_trx,
      retry_trx_num_blocks,
      transaction: {
        signatures,
        compression: 0,
        packed_context_free_data: arrayToHex(
          serializedContextFreeData || new Uint8Array(0)
        ),
        packed_trx: arrayToHex(serializedTransaction)
      }
    })
  }

  /** Send readonly transaction */
  async send_readonly_transaction({
    signatures,
    serializedTransaction,
    serializedContextFreeData
  }) {
    return await this.fetch("/v1/chain/send_read_only_transaction", {
      transaction: {
        signatures,
        compression: 0,
        packed_context_free_data: arrayToHex(
          serializedContextFreeData || new Uint8Array(0)
        ),
        packed_trx: arrayToHex(serializedTransaction)
      }
    })
  }

  /** Raw call to `/v1/db_size/get` */
  async db_size_get() {
    return await this.fetch("/v1/db_size/get", {})
  }

  /** Raw call to `/v1/history/get_actions` */
  async history_get_actions(accountName, pos = null, offset = null) {
    return await this.fetch("/v1/history/get_actions", {
      account_name: accountName,
      pos,
      offset
    })
  }

  /** Raw call to `/v1/history/get_transaction` */
  async history_get_transaction(id, blockNumHint = null) {
    return await this.fetch("/v1/history/get_transaction", {
      id,
      block_num_hint: blockNumHint
    })
  }

  /** Raw call to `/v1/history/get_key_accounts` */
  async history_get_key_accounts(publicKey) {
    return await this.fetch("/v1/history/get_key_accounts", {
      public_key: publicKey
    })
  }

  /** Raw call to `/v1/history/get_controlled_accounts` */
  async history_get_controlled_accounts(controllingAccount) {
    return await this.fetch("/v1/history/get_controlled_accounts", {
      controlling_account: controllingAccount
    })
  }
} // JsonRpc
