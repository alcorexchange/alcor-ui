export default ({ app: { store } }) => {
  window.onNuxtReady(() => {
    store.dispatch('chain/init')
    store.dispatch('init')
  })
}
