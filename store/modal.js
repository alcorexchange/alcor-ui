export const state = () => ({
  current: '',
  visible: false
})

export const mutations = {
  setCurrent: (state, value) => state.current = value,
  setVisible: (state, value) => state.visible = value
}

export const actions = {
  login({ commit }) {
    commit('setCurrent', 'login')
    commit('setVisible', true)
  },

  closeModal({ commit }) {
    commit('setVisible', false)
  }
}
