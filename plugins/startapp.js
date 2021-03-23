import Vue from 'vue'
import { JsonRpc } from 'eosjs'
import fetch from 'node-fetch'

import { uuidv4 } from '~/utils'

export default ({ app: { store, $axios } }, inject) => {
  const socket = require('socket.io-client')(store.state.baseUrl)
  const rpc = new JsonRpc(store.state.network.protocol + '://' + store.state.network.host + ':' + store.state.network.port, { fetch })

  inject('socket', socket)
  inject('rpc', rpc)

  window.onNuxtReady(() => {
    $axios.setBaseURL(store.state.baseUrl + '/api')

    store.dispatch('init')
    store.dispatch('swap/init')
    store.dispatch('chain/init')
    store.dispatch('coinswitch/init')

    // Set device ID
    if (localStorage.getItem('device_id') === null) {
      localStorage.setItem('device_id', uuidv4())
    }

    if (process.env.isDev) {
      const VConsole = require('vconsole')
      Vue.prototype.$vConsole = new VConsole()
    }
  })
}
