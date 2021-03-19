import Vue from 'vue'
import { uuidv4 } from '~/utils'

export default ({ app: { store } }) => {
  Vue.prototype.$socket = require('socket.io-client')(store.state.baseUrl)

  window.onNuxtReady(() => {
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
