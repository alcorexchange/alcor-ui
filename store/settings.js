export const state = () => ({
  sideMaretsTab: 'all',
  favMarkets: [],
  twChart: {}
})

export const mutations = {
  setFavMarkets: (state, markets) => state.favMarkets = markets,
  setSideMaretsTab: (state, tab) => state.sideMaretsTab = tab,
  setTwChart: (state, config) => state.twChart = config
}

export const actions = {}

export const getters = {
}
