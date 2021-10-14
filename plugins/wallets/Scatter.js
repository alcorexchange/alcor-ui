import { JsonRpc, Api } from 'eosjs'

import ScatterJS from 'scatterjs-core'
import ScatterEOS from 'scatterjs-plugin-eosjs2'

class WalletBase {
  network = null

  constructor(network) {
    this.network = network
  }
}

export default class WCWWallet extends WalletBase {
  scatter_plugin = null
  scatter_api = null

  getScatter = () => this.scatter_api || this.scatter_plugin

  accountPublickey = null
  signatureProvider = null

  constructor(network, rpc) {
    super(network)

    ScatterJS.plugins(new ScatterEOS())

    if (typeof window !== 'undefined' || typeof document !== 'undefined') {
      document.addEventListener('scatterLoaded', () => {
        console.log('scatter connect in hook')
        this.scatter_plugin = window.scatter
      })
    }

    this.connect()
  }

  async connect() {
    const scatter = this.getScatter()
    if (scatter && await scatter.isConnected()) return true

    const connected = await ScatterJS.scatter.connect('Alcor Exchange', { network: this.network })

    if (connected) {
      this.scatter_api = ScatterJS.scatter
      return true
    } else {
      console.log('Cannot connect to Scatter...')
    }
  }

  async checkLogin() {
  }

  async login() {
    const scatter = this.getScatter()
    try {
      await scatter.checkLogin()
    } catch (e) {
      console.log('check login err', e)
    }

    try {
      // Useful for testnets to provide a convenient means for the end use to quickly add
      // the required network configuration to their Scatter seamlessly while logging in.
      await scatter.suggestNetwork({ ...this.network, blockchain: 'eos' })

      const identity = await scatter.getIdentity({
        accounts: [{ ...this.network, blockchain: 'eos' }]
      })

      if (!identity) {
        return Promise.reject('No identity obtained from Scatter')
      }

      const account =
        (identity &&
          identity.accounts &&
          identity.accounts.find((x) => x.blockchain === 'eos')) || undefined

      if (!account) {
        return Promise.reject(
          'No account data obtained from Scatter identity'
        )
      }

      this.accountPublickey = account.publicKey

      return {
        name: account.name,
        authorization: { actor: account.name, permission: account.authority }
      }
    } catch (error) {
      console.log('[scatter]', error)
      return Promise.reject(error)
    }
  }

  logout() {
    const scatter = this.getScatter()

    try {
      return scatter.logout()
    } catch {
      return scatter.forgetIdentity()
    }
  }

  transact(actions) {
    let eos

    if ('eosHook' in this.scatter) {
      console.log('sing using eosHook...')
      eos = this.scatter.eosHook({ ...this.network, blockchain: 'eos' }, null, true)
    } else {
      console.log('sing using eos object (old way)...')
      const jNetwork = ScatterJS.Network.fromJson({ ...this.network, blockchain: 'eos' })
      const rpc = new JsonRpc(jNetwork.fullhost())
      eos = this.scatter.eos(jNetwork, Api, { rpc })
    }

    return eos.transact({ actions }, { blocksBehind: 3, expireSeconds: 1200 })
  }
}
