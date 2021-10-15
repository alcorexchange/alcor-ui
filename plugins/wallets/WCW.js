import * as waxjs from '@waxio/waxjs/dist'

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

    const wax = new waxjs.WaxJS({ rpcEndpoint: 'https://wax.greymass.com', tryAutoLogin: false })
    wax.rpc = rpc
    this.wax = wax
  }

  async checkLogin() {
    const isAutoLoginAvailable = await this.wax.isAutoLoginAvailable()

    if (isAutoLoginAvailable) {
      return {
        name: this.wax.user.account,
        authorization: {
          actor: this.wax.user.account, permission: 'active'
        }
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
        actor: userAccount, permission: 'active'
      }
    }
  }

  transact(actions) {
    return this.wax.api.transact({ actions }, { blocksBehind: 3, expireSeconds: 1200 })
  }
}
