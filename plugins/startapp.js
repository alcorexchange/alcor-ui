import Vue from 'vue'
import { uuidv4 } from '~/utils'

export default ({ app: { store, $axios } }, inject) => {
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
