/* eslint-disable no-debugger, no-console */
export const state = () => ({
  isActive: false,
  title: 'Connecting',
  text: ''
})

export const mutations = {
  OPEN(state, { title = 'Connecting', text = 'Connecting' } = {}) {
    state.isActive = true
    state.title = title
    state.text = text
  },
  CLOSE(state) {
    state.isActive = false
  }
}
export const actions = {}
export const getters = {
  isActive: (state) => state.isActive,
  title: (state) => state.title,
  text: (state) => state.text
}
