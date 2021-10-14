import { ConnectWallet } from '@proton/web-sdk'

class ProtonProvider {
  id = 'proton'

  meta = {
    name: 'Proton Web SDK',
    shortName: 'Proton Web SDK',
    description: 'Use Proton Wallet to sign transactions'
  }

  link = null
  session = null
  sessionId = null
  sessionProvider = null

  signatureProvider = {
    getAvailableKeys: () => {
      if (!this.sessionProvider) {
        throw new Error('Not logged in')
      }
      return this.sessionProvider.getAvailableKeys()
    },
    sign: (args) => {
      if (!this.sessionProvider) {
        throw new Error('Not logged in')
      }
      return this.sessionProvider.sign(args)
    }
  }

  constructor(appName, options) {
    //this.link = link
    //this.sessionId = sessionId

    this.appName = appName
    this.options = options
  }

  async connect() {}
  async disconnect() {}

  async login(sessionId) {
    const { link, session } = await ConnectWallet({
      linkOptions: {
        endpoints: ['https://proton.greymass.com']
      },
      transportOptions: {
        requestAccount: this.options.requestAccount, /* Optional: Your proton account */
        requestStatus: true
      },
      selectorOptions: {
        appName: 'Alcor Exchange',
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
        },

        walletType: 'proton'
      }
    })

    this.link = link
    this.session = session
    this.sessionProvider = session.makeSignatureProvider()

    return {
      accountName: session.auth.actor,
      permission: session.auth.permission,
      publicKey: session.publicKey
    }
  }

  async logout(accountName, permission) {
    //if (accountName && permission) {
    //  await this.link.removeSession(this.sessionId, {
    //    actor: accountName,
    //    permission
    //  })
    //}
  }
}

export default function makeProvider(appName, options) {
  return function(network) {
    return new ProtonProvider(appName, options)
  }
}
