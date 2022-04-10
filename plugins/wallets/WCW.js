import * as waxjs from '@waxio/waxjs/dist'

const LIMITLESS_WAX_PUBLIC_KEY =
  'PUB_K1_7FUX7yAxiff74N2GEgainGr5jYnKmeY2NjXagLMsyFbNX9Hkup'
const LIMITLESS_WAX_ENDPOINT = 'https://api.limitlesswax.co/cpu-rent'

class WalletBase {
  network = null

  constructor(network) {
    this.network = network
  }

  logout() {}
}

export default class WCWWallet extends WalletBase {
  wax = null

  constructor(network, rpc) {
    super(network)

    const wax = new waxjs.WaxJS({
      rpcEndpoint: 'https://wax.greymass.com',
      tryAutoLogin: false,
      apiSigner,
    })
    wax.rpc = rpc
    this.wax = wax
  }

  async checkLogin() {
    const isAutoLoginAvailable = await this.wax.isAutoLoginAvailable()

    if (isAutoLoginAvailable) {
      return {
        name: this.wax.user.account,
        authorization: {
          actor: this.wax.user.account,
          permission: 'active',
        },
      }
    } else {
      return null
    }
  }

  async login() {
    const userAccount = await this.wax.login()

    return {
      name: userAccount,
      authorization: {
        actor: userAccount,
        permission: 'active',
      },
    }
  }

  transact(actions) {
    return this.wax.api.transact(actions, {
      blocksBehind: 5,
      expireSeconds: 1200,
    })
  }
}
const apiSigner = {
  getAvailableKeys: () => {
    return [LIMITLESS_WAX_PUBLIC_KEY]
  },
  sign: async (data) => {
    if (!data.requiredKeys.includes(LIMITLESS_WAX_PUBLIC_KEY)) {
      return {
        signatures: [],
        serializedTransaction: data.serializedTransaction,
      }
    }
    const request = {
      transaction: Array.from(data.serializedTransaction),
    }

    const response = await fetch(LIMITLESS_WAX_ENDPOINT, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    })

    if (!response.ok) {
      const body = await response.json()
      alert(body.message)
      throw new Error(body.message || 'Failed to connect to endpoint')
    }

    const json = await response.json()
    console.debug('response:', json)

    if (!json.isOk) {
      alert(json.message)
      throw new Error(json.message)
    }
    const output = {
      signatures: json.signature,
      serializedTransaction: data.serializedTransaction,
    }
    return output
  },
}
