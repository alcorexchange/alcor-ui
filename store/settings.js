export const state = () => ({
  hideOtherPairs: false,
  sideMaretsTab: 'all',
  favMarkets: [],
  twChart: {}
})

export const mutations = {
  setFavMarkets: (state, markets) => state.favMarkets = markets,
  setSideMaretsTab: (state, tab) => state.sideMaretsTab = tab,
  setTwChart: (state, config) => state.twChart = config,
  setHideOtherPairs: (state, value) => state.hideOtherPairs = value
}

export const actions = {}

export const getters = {
}
