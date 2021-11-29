export const state = () => ({
  sideMaretsTab: 'all',
  favMarkets: []
})

export const mutations = {
  setFavMarkets: (state, markets) => state.favMarkets = markets,
  setSideMaretsTab: (state, tab) => state.sideMaretsTab = tab
}

export const actions = {}

export const getters = {
}
