import axios from 'axios'

const LIMITLESS_WAX_ENDPOINT = 'https://api.limitlesswax.co/'

// Used only for wax
export class LimitlessSigner {
  constructor (network) {
    if (network.name != 'wax') throw new Error('LimitlessSigner working only for WAX')
    this.network = network
  }

  async isAvailable() {
    try {
      const r = await axios.get(LIMITLESS_WAX_ENDPOINT)
      console.log(r)
    } catch {

    }
  }
}

//if (rootState.network.name == 'wax') {
//  // Verify cosinging endpoint is online
//  const original_actions = actions
//  let response = {}
//  try {
//    response = await fetch(rootState.network.LIMITLESS_WAX_ENDPOINT, {
//      method: 'GET',
//      headers: {
//        Accept: 'application/json',
//        'Content-Type': 'application/json'
//      }
//    })
//  } catch (e) {
//    console.error(e)
//    console.log(JSON.stringify(e))
//    response.status = 400
//  }

//  let enough_cpu = false
//  try {
//    const account_info = await fetch(
//      rootState.network.hyperion +
//        '/v2/state/get_account?limit=1&skip=0&account=limitlesswax',
//      {
//        method: 'GET',
//        headers: {
//          Accept: 'application/json',
//          'Content-Type': 'application/json'
//        }
//      }
//    )
//    const account_info_json = await account_info.json()
//    if (parseInt(account_info_json.account.cpu_limit.available) > 5000) {
//      console.log('Enough cpu left')
//      enough_cpu = true
//    } else {
//      console.log('Not enough cpu')
//      enough_cpu = false
//    }
//  } catch (e) {
//    console.error(e)
//    console.log(JSON.stringify(e))
//    enough_cpu = false
//  }

//  let cosignpayer = ''
//  let index = 0
//  let enough_bank_wax = false
//  let ms = 1
//  if (actions[0].data.to == 'alcorammswap') {
//    cosignpayer = 'alcorammswap'
//    index = 1
//  }
//  if (actions[0].data.to == 'alcordexmain') {
//    cosignpayer = 'alcordexmain'
//    index = 0
//    ms = 2
//  }
//  try {
//    const bank_wax = this.$rpc.get_table_rows({
//      json: true, // Get the response as json
//      code: 'limitlessbnk', // Contract that we target
//      scope: 'limitlessbnk', // Account that owns the data
//      table: 'waxdeposits', // Table name
//      limit: 100, // Maximum number of rows that we want to get
//      reverse: false, // Optional: Get reversed data
//      show_payer: false // Optional: Show ram payer
//    })
//    for (let i = 0; i < bank_wax.rows.length; i++) {
//      if (bank_wax.rows[i].index == index) {
//        if (parseFloat(bank_wax.rows[i].deposit) > 0.1) {
//          enough_bank_wax = true
//        }
//      }
//    }
//    if (!enough_bank_wax) console.log('Not enough wax in bank')
//  } catch (e) {
//    console.log('Not enough wax in bank')
//    console.log(JSON.stringify(e))
//  }
//  // Cannot cosign for user
//  if (
//    response.status != 200 ||
//    enough_cpu == false ||
//    enough_bank_wax == false
//  ) {
//    return await getters.wallet.transact({
//      max_cpu_usage_ms: 10,
//      max_net_usage_words: 10000,
//      actions
//    })
//  } else {
//    // Can cosign for user
//    let cpu_cost = 0.02
//    try {
//      const table = await this.$rpc.get_table_rows({
//        json: true, // Get the response as json
//        code: 'limitlessbnk', // Contract that we target
//        scope: 'limitlessbnk', // Account that owns the data
//        table: 'config', // Table name
//        limit: 1, // Maximum number of rows that we want to get
//        reverse: false, // Optional: Get reversed data
//        show_payer: false, // Optional: Show ram payer
//      })
//      cpu_cost = parseFloat(table.rows[0].cost)
//    } catch (e) {
//      console.log(JSON.stringify(e))
//      console.log('Cant determine cost')
//    }
//    const cosign = {
//      account: 'limitlesswax',
//      name: 'paycpu',
//      data: {
//        user: rootState.user.name,
//        info: ms + ' ms max, alcor',
//      },
//      authorization: [
//        {
//          actor: 'limitlesswax',
//          permission: 'cosign',
//        },
//      ],
//    }
//    const cosignpay = {
//      account: 'limitlessbnk',
//      name: 'sendwax',
//      data: {
//        table_index: index,
//        owner: 'alcordexfund',
//        ms,
//        maincontract: cosignpayer,
//        amount: (cpu_cost * ms).toFixed(8) + ' WAX',
//      },
//      authorization: [
//        {
//          actor: 'limitlesswax',
//          permission: 'cosign',
//        },
//      ],
//    }

//    actions = [cosign, cosignpay, ...actions]
//    if (state.currentWallet == 'anchor') {
//      const transaction = await apiWAX.transact(
//        {
//          max_cpu_usage_ms: ms,
//          max_net_usage_words: 1000 * ms,
//          actions,
//        },
//        {
//          broadcast: false,
//          sign: false,
//          blocksBehind: 5,
//          expireSeconds: 1200,
//        }
//      )
//      const deserializedTransaction = await apiWAX.deserializeTransaction(
//        transaction.serializedTransaction
//      )
//      const abis = await apiWAX.getTransactionAbis(
//        deserializedTransaction
//      )
//      const serializedContextFreeData =
//        await apiWAX.serializeContextFreeData(
//          deserializedTransaction.context_free_data
//        )

//      const chainId = rootState.network.chainId
//      const requiredKeys =
//        await getters.wallet.sessionProvider.getAvailableKeys()
//      const serializedTransaction = transaction.serializedTransaction
//      const signedTransaction = await getters.wallet.sign(
//        deserializedTransaction
//      )

//      const request = {
//        transaction: Array.from(serializedTransaction),
//      }

//      const response = await fetch(
//        rootState.network.LIMITLESS_WAX_ENDPOINT + 'cpu-rent',
//        {
//          method: 'POST',
//          headers: {
//            Accept: 'application/json',
//            'Content-Type': 'application/json',
//          },
//          body: JSON.stringify(request),
//        }
//      )

//      if (!response.ok) {
//        const body = await response.json()
//        throw new Error(body.reason || 'Failed to connect to endpoint')
//      }

//      const json = await response.json()

//      if (!json.isOk) {
//        throw new Error(json.reason)
//      }

//      const sigs = []
//      if (json.signature) {
//        sigs.push(json.signature[0])
//        sigs.push(signedTransaction.signatures[0])
//      }

//      const full_transaction = {
//        signatures: sigs,
//        compression: false,
//        serializedContextFreeData,
//        serializedTransaction,
//      }

//      try {
//        const completed_transaction = await apiWAX.rpc.send_transaction(
//          full_transaction
//        )
//        return completed_transaction
//      } catch (e) {
//        console.log(e)
//        throw new Error(e)
//      }
//    }
//    if (state.currentWallet == 'wcw') {
//      return await getters.wallet.transact({
//        max_cpu_usage_ms: ms,
//        max_net_usage_words: 1000 * ms,
//        actions,
//      })
//    }
//    // not logged in with anchor or wcw
//    return await getters.wallet.transact(original_actions)
//  }
//}

