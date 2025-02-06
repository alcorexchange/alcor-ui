import * as waxjs from '@waxio/waxjs/dist'

class WalletBase {
  network = null

  constructor(network) {
    this.network = network
  }

  logout() {}
}

export default class WCWWallet extends WalletBase {
  name = 'ultra'
  ultra = null

  constructor(network, rpc) {
    super(network)

    this.ultra = window.ultra
  }

  async checkLogin() {
    return console.log('checkLogin not implemented')

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
    console.log('ultra', this.ultra)

    if (!this.ultra) {
      throw new Error('No Ultra wallet plugin found')
    }

    const { status, data } = await this.ultra.connect()

    if (status != 'success') {
      throw new Error('Wallet connect error: ' + status)
    }

    const name = data.blockchainid.split('@')[0]

    return {
      name,
      authorization: {
        actor: name, permission: 'active'
      }
    }
  }

  transact({ actions }) {
    const transactions = actions.map(a => {
      return {
        contract: a.account,
        action: a.name,
        data: a.data
      }
    })

    return this.ultra.signTransaction(transactions)
  }
}
