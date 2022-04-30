export const state = () => ({
  hideOtherPairs: false,
  sideMaretsTab: 'all',
  favMarkets: [],
  twChart: {},
  timesAndSales: {},

  current_node: '',
  auto_node_select: true
})

export const mutations = {
  setFavMarkets: (state, markets) => state.favMarkets = markets,
  setSideMaretsTab: (state, tab) => state.sideMaretsTab = tab,
  setTwChart: (state, config) => state.twChart = config,
  setHideOtherPairs: (state, value) => state.hideOtherPairs = value,
  setTimesAndSales: (state, value) => state.timesAndSales = value,
  setAutoNodeSelect: (state, value) => state.auto_node_select = value
}

export const actions = {
  updateTimeAndSales({ state, commit }, { market, key, value }) {
    const old = JSON.parse(JSON.stringify(state.timesAndSales))

    const current = old[market] || {}
    current[key] = value

    old[market] = current

    commit('setTimesAndSales', { ...old })
  }
}

export const getters = {
}
