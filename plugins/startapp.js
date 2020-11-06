import Vue from 'vue'

export default ({ app: { store } }) => {
  window.onNuxtReady(() => {
    store.dispatch('chain/init')
    store.dispatch('init')

    const socket = require('socket.io-client')('/')
    socket.on('update_market', data => {
      updateAppOnServerPush(store, data)
    })

    if (process.env.isDev) {
      const VConsole = require('vconsole')
      Vue.prototype.$vConsole = new VConsole()
    }
  })
}

// Just place it here for a while FIXME
function updateAppOnServerPush(store, data) {
  if (store.state.market.id == data.market) {
    store.dispatch('market/update')

    if (store.state.market.barStream) {
      store.state.market.barStream()
    }
  }
}
