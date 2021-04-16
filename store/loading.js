/* eslint-disable no-debugger, no-console */
export const state = () => ({
  isActive: false
})

export const mutations = {
  OPEN(state) {
    state.isActive = true
  },
  CLOSE(state) {
    state.isActive = false
  }
}
export const actions = {}
export const getters = {
  isActive: (state) => state.isActive
}
