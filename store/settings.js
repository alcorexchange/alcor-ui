// import Ping from 'ping.js'
// const ping = new Ping()

export const state = () => ({
  hideOtherPairs: false,
  sideMaretsTab: 'system', // System token
  markets_timesale_tab: '1',
  favMarkets: [],
  twChart: {},
  timesAndSales: {},
  tradeColor: '',

  current_node: null,
  auto_node_select: true,
  rpc_nodes: {},

  appVersion: null
})

export const mutations = {
  setFavMarkets: (state, markets) => state.favMarkets = markets,
  setLastVersion: (state, version) => state.appVersion = version,
  setSideMaretsTab: (state, tab) => state.sideMaretsTab = tab,
  setTwChart: (state, config) => state.twChart = config,
  setSwapTwChart: (state, config) => state.swapTwChart = config,
  setHideOtherPairs: (state, value) => state.hideOtherPairs = value,
  setTimesAndSales: (state, value) => state.timesAndSales = value,
  setTradeColor: (state, value) => state.tradeColor = value,
  setAutoNodeSelect: (state, value) => state.auto_node_select = value,
  setRpcNodes: (state, value) => state.rpc_nodes = value,
  updateRpcNode: (state, { key, value }) => state.rpc_nodes[key] = value,
  setCurrentNode: (state, value) => state.current_node = value,
  setMarketsTimesaleTab: (state, value) => state.markets_timesale_tab = value
}

export const actions = {
  init({ state, commit, dispatch }) {
    //window.addEventListener('eosjsRpcSwitched', e => {
    //  commit('setCurrentNode', e.detail)
    //  this._vm.$notify({ type: 'warning', title: 'Node Connection CHANGED!', message: e.detail })
    //})

    //dispatch('checkNodes')
    // TODO Current rpc check

    dispatch('fetchLastCommit')
  },

  async fetchLastCommit({ state, commit }) {
    const { data: { sha } } = await this.$axios.get(
      'https://api.github.com/repos/avral/alcor-ui/commits/master'
    )

    console.log('LAST COMMIT', sha)

    if (state.appVersion !== sha) {
      if (state.appVersion === null) {
        console.log('initial app loading')
        commit('setLastVersion', sha)
      } else {
        commit('setLastVersion', sha)
        console.log('reload for new version')
        window.location.reload(true)
      }
    }
  },

  checkNodes({ state, commit }) {
    // TODO
    //console.log('RPC SET!')
    //this.$rpc.setEndpoints(['https://api2.hivebp.io'])

    //this._vm.prototype.$rpc = JsonRpc('https://api2.hivebp.io/', { fetch })
    //const all_nodes = [...]
    //const ping_requests = []

    //Object.keys(state.rpc_nodes).map(n => {
    //  ping.ping(n + '/v1/chain/get_info', (err, data) => {
    //    if (err) return console.log('RPC PING FALIING: ', n, err)
    //    commit('updateRpcNode', { key: n, value: {  } })
    //  })
    //})

    //const nodes_updated = {}

    //for (let [key, value] of Object.entries(state.rpc_nodes)) {
    //  console.log('node: ', node)
    //}
  },

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
