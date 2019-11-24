import config from '~/config'
import { hyperion, getSellOrders, getBuyOrders } from '~/api'
import { sort_by_price, parseAsset, prepareOrder, parseExtendedAsset } from '~/utils'

export const state = () => ({
  id: null,
  token: {},

  bids: [],
  asks: [],

  history: []
})

export const mutations = {
  setId: (state, id) => state.id = id,
  setBids: (state, bids) => state.bids = bids,
  setAsks: (state, asks) => state.asks = asks,
  setHistory: (state, history) => state.history = history,
  setToken: (state, token) => state.token = token
}

export const actions = {
  async fetchMarket({ rootState, state, commit, rootGetters }) {
    const rpc = rootGetters['chain/rpc']

    const { rows: [market] } = await rpc.get_table_rows({
      code: config.contract,
      scope: config.contract,
      table: 'markets',
      // key_type: 'i128',
      // encode_type: 'hex',
      // index_position: '2',
      // lower_bound: i128_key,
      lower_bound: state.id, // FIXME Сделать короче по uint128 поиск
      limit: 1
    })

    if (market.id != state.id) {
      throw new Error(`Market with id ${market.id} not found or closed :(`)
    }

    commit('setToken', parseExtendedAsset(market.token))
    commit('setId', market.id)

    Promise.all([getBuyOrders(state.id), getSellOrders(state.id)]).then(([buyOrders, sellOrders]) => {
      buyOrders.map(o => prepareOrder(o))
      sellOrders.map(o => prepareOrder(o))

      commit('setBids', buyOrders)
      commit('setAsks', sellOrders)
    })
  }
}

export const getters = {
  token (state) {
    return state.token || {}
  },

  wrongPrice() {
    //if (this.totalEos === 0.0 || !this.amount || !this.price) return false

    //return assetToAmount(this.amount, 4) * assetToAmount(this.price, 8) % config.PRICE_SCALE !== 0
    return 'todo'
  },

  history(state, getters, rootState) {
    return rootState.history.filter(h => parseInt(h.market.id) == parseInt(state.id))
  },

  volume24(state, getters, rootState) {
    const oneday = 60 * 60 * 24 * 1000

    let result = 0
    getters.history.filter(h => {
      return Date.now() - oneday < h.time.getTime()
    }).map(m => {
      m.type == 'buymatch' ? result += parseFloat(m.bid.quantity) : result += parseFloat(m.ask.quantity)
    })

    return result.toFixed(4) + ' EOS'
  },

  price(state) {
    let price = 0

    if (state.bids.length)
      price = state.bids.sort(sort_by_price)[0].unit_price
    else if (state.asks.length)
      price = state.asks.sort(sort_by_price)[state.asks.length - 1].unit_price

    return price
  },

  sorted_asks(state) {
    return state.asks.slice().sort(sort_by_price)
  },

  sorted_bids(state) {
    return state.bids.slice().sort(sort_by_price)
  }
}
