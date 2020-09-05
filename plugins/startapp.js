export default ({ app: { store } }) => {
  window.onNuxtReady(() => {
    store.dispatch('chain/init')
    store.dispatch('init')

    const socket = require('socket.io-client')('/')
    socket.on('update_push', data => {
      updateAppOnServerPush(store, data)
    })
  })
}

// Just place it here for a while FIXME
function updateAppOnServerPush(store, data) {

}
