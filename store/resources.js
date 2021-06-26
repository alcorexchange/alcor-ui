export const state = () => ({
  isActive: false,
})

export const mutations = {
  OPEN(state) {
    state.isActive = true
    console.log('OPEN resources')
  },
  CLOSE(state) {
    state.isActive = false
  }
}
export const actions = {}
export const getters = {
  isActive: (state) => state.isActive,
}
