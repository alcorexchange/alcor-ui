import createPersistedState from 'vuex-persistedstate'

export default ({ store }) => {
  window.onNuxtReady(() => {
    createPersistedState({
      key: 'presist_v0.1',
      paths: ['chain.payForUser', 'theme']
    })(store)

    // Theme management
    if (store.state.theme) {
      document.documentElement.classList.add(`theme-${store.state.theme}`)
    } else {
      document.documentElement.classList.add('theme-light')
    }
  })
}
