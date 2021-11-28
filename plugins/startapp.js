import { uuidv4 } from '~/utils'

export default ({ app: { store, $axios } }, inject) => {
  window.onNuxtReady(() => {
    $axios.setBaseURL(store.state.baseUrl + '/api')

    // Set device ID
    if (localStorage.getItem('device_id') === null) {
      localStorage.setItem('device_id', uuidv4())
    }

    store.dispatch('init')
    store.dispatch('swap/init')
    store.dispatch('chain/init')
    store.dispatch('market/init')
    store.dispatch('wallet/init')
    //store.dispatch('coinswitch/init')

    if (process.env.isDev) {
      //const VConsole = require('vconsole')
      //Vue.prototype.$vConsole = new VConsole()
    }
  })
}
