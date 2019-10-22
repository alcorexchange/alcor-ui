import Vue from 'vue'

export default ({app: { store }}) => {
  window.onNuxtReady(() => {
    store.dispatch('chain/init')
  })
}
