export const state = () => ({
  hideOtherPairs: false,
  sideMaretsTab: 'all',
  favMarkets: [],
  twChart: {},
  timesAndSales: {},

  current_node: null,
  auto_node_select: true,
  rpc_nodes: []
})

export const mutations = {
  setFavMarkets: (state, markets) => state.favMarkets = markets,
  setSideMaretsTab: (state, tab) => state.sideMaretsTab = tab,
  setTwChart: (state, config) => state.twChart = config,
  setHideOtherPairs: (state, value) => state.hideOtherPairs = value,
  setTimesAndSales: (state, value) => state.timesAndSales = value,
  setAutoNodeSelect: (state, value) => state.auto_node_select = value,
  setRpcNodes: (state, value) => state.rpc_nodes = value,
  setCurrentNode: (state, value) => state.current_node = value
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
