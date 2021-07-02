export const state = () => ({
  isActive: false,
  reslove: null
})

export const mutations = {
  OPEN(state) {
    state.isActive = true
  },
  CLOSE(state) {
    state.isActive = false
    state.resolve && state.resolve()
  },
  SET_RESOLVE(state, resolve) {
    state.resolve = resolve
  }
}
export const actions = {
  showIfNeeded({ commit, rootState }) {
    return new Promise((resolve) => {
      const account = rootState.account
      // don't open the modal if there is no account or available CPU is over 500
      //if (!account || account.cpu_limit.available > 500) {
      if (!account || account.cpu_limit.available > 1000) {
        resolve()
      } else {
        commit('OPEN')
        commit('SET_RESOLVE', resolve)
      }
    })
  }
}
export const getters = {
  isActive: (state) => state.isActive
}
