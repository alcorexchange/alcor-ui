import { JsonRpc, Api } from 'eosjs'

import ScatterEOS from '@scatterjs/eosjs2'
import ScatterJS from '@scatterjs/core'
//import ScatterJS from 'scatterjs-core'
//import ScatterEOS from 'scatterjs-plugin-eosjs2'
//if (typeof window !== 'undefined' || typeof document !== 'undefined') {
//  document.addEventListener('scatterLoaded', () => {
//    console.log('scatter connected!!!!!!!!!!')
//    this.scatter_plugin = window.scatter
//  })
//}

class WalletBase {
  network = null

  constructor(network) {
    this.network = network
  }
}

export default class WCWWallet extends WalletBase {
  name = 'scatter'

  scatter_plugin = null
  scatter_api = null

  getScatter = () => this.scatter_api || this.scatter_plugin

  accountPublickey = null
  signatureProvider = null

  constructor(network, rpc) {
    super(network)
    this.rpc = rpc

    ScatterJS.plugins(new ScatterEOS())
  }

  async connect() {
    const connected = await ScatterJS.scatter.connect('Alcor Exchange', { network: this.network })
    console.log('connected', connected)

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
    try {
      await this.connect()
      const { accounts: [{ authority, name }] } = await ScatterJS.login()

      return {
        name,
        authorization: { actor: name, permission: authority }
      }
    } catch (error) {
      console.log('[scatter]', error)
      return Promise.reject(error.message)
    }
  }

  async logout() {
    await ScatterJS.logout()
  }

  transact(...args) {
    const network = ScatterJS.Network.fromJson({ ...this.network, blockchain: 'eos' })
    const rpc = new JsonRpc(network.fullhost())
    const eos = ScatterJS.eos(network, Api, { rpc })

    return eos.transact(...args)
  }
}
