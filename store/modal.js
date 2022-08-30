export const state = () => ({
  current: '',
  visible: false,
  context: null
})

export const mutations = {
  setCurrent: (state, value) => state.current = value,
  setVisible: (state, value) => state.visible = value,
  setModalContext: (state, value) => state.context = value
}

export const actions = {
  login({ commit }) {
    commit('setCurrent', 'login')
    commit('setVisible', true)
  },

  buy({ commit }, context) {
    commit('setCurrent', 'buy-listing')
    commit('setVisible', true)
    commit('setModalContext', context)
  },

  closeModal({ commit }) {
    commit('setVisible', false)
  }
}
