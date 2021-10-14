import AnchorLink from 'anchor-link'
import AnchorLinkBrowserTransport from 'anchor-link-browser-transport'

class WalletBase {
  network = null

  constructor(network) {
    this.network = network
  }
}


export default class AnchoWallet extends WalletBase {
  link = null
  session = null

  constructor(network, rpc) {
    super(network)

    this.link = new AnchorLink({
      transport: new AnchorLinkBrowserTransport(),
      chains: [
        {
          chainId: this.network.chainId,
          nodeUrl: `${network.protocol}://${network.host}:${network.port}`
        }
      ]
    })
  }

  async checkLogin() {
    const session = await this.link.restoreSession('Alcor Exchange')

    if (session) {
      this.session = session
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
    const identity = await this.link.login('Alcor Exchange')
    this.session = identity.session

    const { actor, permission } = this.session.auth

    return {
      name: actor.toString(),
      authorization: { actor: actor.toString(), permission: permission.toString() }
    }
  }

  transact(actions) {
    return this.session.transact({ actions })
  }
}
