import Vue from 'vue'
import { uuidv4 } from '~/utils'

// DEBUG
function logHeapSizeInMB() {
  if (performance.memory) {
    const memory = performance.memory
    const jsHeapSizeLimitMB = (memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)
    const totalJSHeapSizeMB = (memory.totalJSHeapSize / 1024 / 1024).toFixed(2)
    const usedJSHeapSizeMB = (memory.usedJSHeapSize / 1024 / 1024).toFixed(2)

    console.log(`${usedJSHeapSizeMB} / ${totalJSHeapSizeMB} / ${jsHeapSizeLimitMB} MB`)
  } else {
    console.log('performance.memory не поддерживается в этом браузере.')
  }
}

export default ({ app: { store, $axios } }, inject) => {
  window.onNuxtReady(() => {
    // FOR MEMORY LEAKS DEBUG!
    // setInterval(() => {
    //   logHeapSizeInMB()
    // }, 2000)

    $axios.setBaseURL(store.state.baseUrl + '/api')

    // Set device ID
    if (localStorage.getItem('device_id') === null) {
      localStorage.setItem('device_id', uuidv4())
    }

    store.dispatch('init')

    store.dispatch('farms/init')
    store.dispatch('chain/init')
    store.dispatch('market/init')
    store.dispatch('wallet/init')
    store.dispatch('settings/init')
    store.dispatch('ibcBridge/init')

    store.dispatch('amm/init')
    store.dispatch('amm/swap/init')

    // if (process.env.isDev) {
    //   const VConsole = require('vconsole')
    //   Vue.prototype.$vConsole = new VConsole()
    // }
  })
}
