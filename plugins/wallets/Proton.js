const ConnectWallet = (...args) => import('@proton/web-sdk').then(({ default: fetch }) => fetch(...args))

class WalletBase {
  network = null

  constructor(network, rpc) {
    this.network = network
    this.rpc = rpc
  }

  logout() {}
}

export default class AnchoWallet extends WalletBase {
  link = null
  session = null

  async checkLogin() {
    const { link, session } = await ConnectWallet({
      linkOptions: { chainId: this.network.chainId, endpoints: ['https://proton.greymass.com'], restoreSession: true },
      transportOptions: { requestAccount: this.network.contract },
      selectorOptions: {
        appName: 'Alcor',
        appLogo: 'https://wax.alcor.exchange/android-chrome-192x192.svg'
      }
    })

    if (session) {
      this.link = link
      this.session = session
      this.link.rpc = this.rpc

      const { actor, permission } = session.auth

      return {
        name: actor.toString(),
        authorization: { actor: actor.toString(), permission: permission.toString() }
      }
    } else {
      return null
    }
  }

  async login() {
    const { link, session } = await ConnectWallet({
      linkOptions: {
        endpoints: ['https://proton.greymass.com']
      },

      transportOptions: {
        requestAccount: this.network.contract,
        requestStatus: true /* Optional: Display request success and error messages, Default true */
      },

      selectorOptions: {
        appName: 'Alcor',
        appLogo: 'https://wax.alcor.exchange/android-chrome-192x192.svg',
        customStyleOptions: {
          modalBackgroundColor: '#F4F7FA',
          logoBackgroundColor: 'white',
          isLogoRound: true,
          optionBackgroundColor: 'white',
          optionFontColor: 'black',
          primaryFontColor: 'black',
          secondaryFontColor: '#6B727F',
          linkColor: '#752EEB'
        }
        //walletType: 'proton'
      }
    })

    if (session) {
      this.link = link
      this.session = session
      this.link.rpc = this.rpc

      const { actor, permission } = session.auth

      return {
        name: actor.toString(),
        authorization: { actor: actor.toString(), permission: permission.toString() }
      }
    } else {
      return null
    }
  }

  async logout() {
    await this.link.removeSession('Alcor Exchange', this.session.auth)
    this.session = undefined
  }

  transact(actions) {
    return this.session.transact({ actions })
  }
}
