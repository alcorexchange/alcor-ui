export const state = () => ({
  current: '',
  visible: false,
  context: null
})

export const mutations = {
  setCurrent: (state, value) => state.current = value,
  setVisible: (state, value) => state.visible = value,
  setContext: (state, value) => state.context = value
}

export const actions = {
  login({ commit }, context) {
    commit('setCurrent', 'login')
    commit('setVisible', true)
    context && commit('setContext', context)
  },

  closeModal({ commit }) {
    commit('setVisible', false)
    commit('setContext', null)
  }
}
