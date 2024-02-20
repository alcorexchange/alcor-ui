import { JsonRpc, Api } from 'eosjs'

import ScatterEOS from '@scatterjs/eosjs2'
import ScatterJS from '@scatterjs/core'
//import ScatterJS from 'scatterjs-core'
//import ScatterEOS from 'scatterjs-plugin-eosjs2'

if (typeof window !== 'undefined' || typeof document !== 'undefined') {
  document.addEventListener('scatterLoaded', () => {
    this.scatter_plugin = window.scatter
    ScatterJS.plugins(new ScatterEOS())
    console.log('scatter connected!!!')
  })
}

class WalletBase {
  network = null

  constructor(network) {
    this.network = network
  }
}

export default class WCWWallet extends WalletBase {
  name = 'scatter'

  constructor(network, rpc) {
    super(network)
    this.rpc = rpc

    ScatterJS.plugins(new ScatterEOS())
  }

  async connect() {
    let connected = false

    try {
      connected = await ScatterJS.scatter.connect('Alcor Exchange', { network: this.network })
    } catch (e) {
    }

    if (connected) return
    throw new Error('No scatter wallet found')
  }

  async checkLogin() {
  }

  async login() {
    try {
      await this.connect()
      const result = await ScatterJS.login()

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
