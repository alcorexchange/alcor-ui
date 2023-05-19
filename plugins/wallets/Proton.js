const ProtonWebSDK = (...args) => import('@proton/web-sdk').then(({ default: fetch }) => fetch(...args))

class WalletBase {
  network = null

  constructor(network, rpc) {
    this.network = network
    this.rpc = rpc
  }

  logout() {}
}

export default class AnchoWallet extends WalletBase {
  name = 'proton'
  link = null
  session = null

  async checkLogin() {
    console.log('check login')
    const { link, session } = await ProtonWebSDK({
      linkOptions: {
        chainId: this.network.chainId,
        endpoints: Object.keys(this.network.client_nodes),
        restoreSession: true,
      },

      transportOptions: {
        //requestAccount: this.network.contract,
        requestAccount: 'alcor',
      },

      selectorOptions: {
        appName: 'Alcor',
        appLogo: 'https://proton.alcor.exchange/android-chrome-192x192.svg',
        customStyleOptions: {
          modalBackgroundColor: '#F4F7FA',
          logoBackgroundColor: 'white',
          isLogoRound: true,
          optionBackgroundColor: 'white',
          optionFontColor: 'black',
          primaryFontColor: 'black',
          secondaryFontColor: '#6B727F',
          linkColor: '#752EEB',
        },
      },
    })

    console.log(link, session)

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
    console.log('this.network.contract', this.network.contract)
    console.log('chainID', this.network.chainId)

    const { link, session } = await ProtonWebSDK({
      linkOptions: {
        chainId: this.network.chainId,
        endpoints: Object.keys(this.network.client_nodes),

        // chainId: '384da888112027f0321850a169f737c33e53b388aad48b5adace4bab97f437e0',
        // endpoints: ['https://proton.greymass.com'],
        //restoreSession: true,
      },

      transportOptions: {
        //requestAccount: this.network.contract,
        requestAccount: 'alcor',
      },

      selectorOptions: {
        appName: 'Alcor',
        appLogo: 'https://proton.alcor.exchange/android-chrome-192x192.svg',
        customStyleOptions: {
          modalBackgroundColor: '#F4F7FA',
          logoBackgroundColor: 'white',
          isLogoRound: true,
          optionBackgroundColor: 'white',
          optionFontColor: 'black',
          primaryFontColor: 'black',
          secondaryFontColor: '#6B727F',
          linkColor: '#752EEB',
        },
      },
    })

    console.log('zzz', session, link)

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

  transact(...args) {
    return this.session.transact(...args)
  }
}
