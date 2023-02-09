import * as waxjs from '@waxio/waxjs/dist'

class WalletBase {
  network = null

  constructor(network) {
    this.network = network
  }

  logout() {}
}

export default class WCWWallet extends WalletBase {
  name = 'wcw'
  wax = null

  constructor(network, rpc) {
    super(network)

    const wax = new waxjs.WaxJS({ rpcEndpoint: 'https://wax.greymass.com', tryAutoLogin: false })
    wax.rpc = rpc
    this.wax = wax
  }

  async checkLogin() {
    const isAutoLoginAvailable = await this.wax.isAutoLoginAvailable()
    console.log('check wax autoLogin', isAutoLoginAvailable)

    if (isAutoLoginAvailable) {
      console.log('wcw auto logined')
      return {
        chainId: '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4', //WCW is only for wax so we hardcode that
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

  transact(...args) {
    return this.wax.api.transact(...args)
  }
}
