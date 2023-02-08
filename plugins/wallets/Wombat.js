import { JsonRpc, Api } from 'eosjs'

import ScatterEOS from '@scatterjs/eosjs2'
import ScatterJS from '@scatterjs/core'
//import ScatterJS from 'scatterjs-core'
//import ScatterEOS from 'scatterjs-plugin-eosjs2'

if (typeof window !== 'undefined' || typeof document !== 'undefined') {
  console.log('try find scatter!!!!!!!!!!!!!!!!!!!!!!!!!!!!!')
  document.addEventListener('scatterLoaded', () => {
    console.log('scatter connect in hook')
    this.wombat = window.scatter
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

  wombat = null

  signatureProvider = null

  constructor(network, rpc) {
    super(network)
    this.rpc = rpc

    ScatterJS.plugins(new ScatterEOS())
    this.connect()
  }

  async connect() {
    let connected = false

    try {
      connected = await ScatterJS.scatter.connect('Alcor Exchange', { network: this.network })
    } catch (e) {
    }

    if (connected) return
    throw new Error('No wombat wallet found')
  }

  async checkLogin() {
  }

  async login() {
    try {
      const { name, accounts } = await ScatterJS.login()
      const authority = accounts.find(a => a.name == name).authority

      return {
        name,
        authorization: { actor: name, permission: authority }
      }
    } catch (error) {
      console.log('[wombat]', error)
      return Promise.reject(error.message)
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

  async transact(...args) {
    const network = ScatterJS.Network.fromJson({ ...this.network, blockchain: 'eos' })
    const rpc = new JsonRpc(network.fullhost())
    const eos = ScatterJS.eos(network, Api, { rpc })

    const result = await eos.transact(...args)
    result.resolved = { serializedTransaction: result.serializedTransaction }

    return result
  }
}
