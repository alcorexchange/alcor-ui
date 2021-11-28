import AnchorLink from 'anchor-link'
import AnchorLinkBrowserTransport from 'anchor-link-browser-transport'

class WalletBase {
  network = null

  constructor(network) {
    this.network = network
  }

  logout() {}
}

export default class AnchoWallet extends WalletBase {
  link = null
  session = null

  constructor(network, rpc) {
    super(network)

    this.createLink()
  }

  logout() {
    this.link = null
  }

  createLink() {
    if (this.link) return null

    const { network } = this

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
    if (!this.link) return null
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
    if (!this.link) this.createLink()
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
