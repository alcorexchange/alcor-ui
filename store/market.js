import { sort_by_price, parseAsset, prepareOrder, parseExtendedAsset } from '~/utils'
import { dayChart } from '~/utils/charts'

export const state = () => ({
  id: null,
  token: {},

  bids: [],
  asks: [],

  history: [],
  orderLoading: false
})

export const mutations = {
  setId: (state, id) => state.id = id,
  setBids: (state, bids) => state.bids = bids,
  setAsks: (state, asks) => state.asks = asks,
  setHistory: (state, history) => state.history = history,
  setToken: (state, token) => state.token = token,
  setOrderLoading: (state, orderLoading) => state.orderLoading = orderLoading
}

export const actions = {
  async fetchMarket({ rootState, state, commit, rootGetters, dispatch }) {
    const rpc = rootGetters['api/rpc']

    const { rows: [market] } = await rpc.get_table_rows({
      code: rootState.network.contract,
      scope: rootState.network.contract,
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

    await Promise.all([
      dispatch('api/getBuyOrders', { market_id: state.id }, { root: true }),
      dispatch('api/getSellOrders', { market_id: state.id }, { root: true })
    ]).then(([buyOrders, sellOrders]) => {
      buyOrders.map(o => prepareOrder(o))
      sellOrders.map(o => prepareOrder(o))

      commit('setBids', buyOrders)
      commit('setAsks', sellOrders)
    }).catch(e => console.log(e))
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

  charts(state, getters, rootState) {
    // It not handle clean action
    const actions = rootState.history.filter(a => {
      const action_name = a.act.name

      if (['cancelbuy', 'cancelsell'].includes(action_name)) {
        return parseInt(a.act.data.market_id) == parseInt(state.id)
      } else if (action_name == 'sellreceipt') {
        return a.act.data.sell_order.bid.split(' ')[1] == state.token.symbol.name
      } else if (action_name == 'buyreceipt') {
        return a.act.data.buy_order.ask.split(' ')[1] == state.token.symbol.name
      } else {
        return parseInt(a.act.data.record.market.id) == parseInt(state.id)
      }
    })

    return actions
  },

  history(state, getters, rootState) {
    return rootState.history
      .filter(m => ['sellmatch', 'buymatch'].includes(m.act.name))
      .filter(h => parseInt(h.act.data.record.market.id) == parseInt(state.id))
      .map(m => {
        const data = m.act.data.record

        data.trx_id = m.trx_id
        data.type = m.act.name
        data.ask = parseAsset(data.ask)
        data.bid = parseAsset(data.bid)

        // FIXME Fix afret fix contract timestamp
        data.time = new Date(m['@timestamp'])

        return data
      })
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
