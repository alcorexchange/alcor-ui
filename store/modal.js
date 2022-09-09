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
    if (context) commit('setModalContext', context)
  },

  transfer({ commit }, context) {
    commit('setCurrent', 'transfer')
    commit('setVisible', true)
    commit('setModalContext', context || null)
  },

  makeOffer({ commit }, context) {
    commit('setCurrent', 'make-offer')
    commit('setVisible', true)
    if (context) commit('setModalContext', context)
  },


  closeModal({ commit }) {
    commit('setVisible', false)
  }
}
