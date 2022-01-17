// TODO Module needs fucking refactoring.
import axios from 'axios'
import debounce from 'lodash/debounce'
import findIndex from 'lodash/findIndex'

import { parseAsset, make256key, nameToUint64 } from '~/utils'

export const strict = false

export const state = () => ({
  user: null,
  userDeals: [],
  userOrders: [],
  userOrdersLoading: true,
  account: null,
  liquidityPositions: [],

  accountLimits: {
    buyorders: {},
    sellorders: {},

    orders_total: 0,
    orders_limit: 50
  },

  markets: [],
  markets_obj: {},
  network: {},

  baseUrl: '',
  tokens: [],
  ibcTokens: ['eth.token'],
  lihgHistoryBlock: null,
  blockNum: null
})

export const mutations = {
  setNetwork: (state, network) => {
    state.network = network
  },

  // TODO Refactor for better balances handling
  // (separate array not in user object)
  updateBalance(state, balance) {
    if (!state.user) return
    if (!state.user.balances) state.user.balances = []

    const balances = JSON.parse(JSON.stringify(state.user.balances))
    const index = findIndex(balances, { id: balance.id })

    if (index !== -1 && parseFloat(balance.amount) <= 0) balances.splice(index, 1)
    else if (index === -1 && parseFloat(balance.amount) <= 0) return
    else if (index === -1) balances.push(balance)
    else balances.splice(index, 1, { ...balances[index], ...balance })

    state.user = { ...state.user, balances }
  },

  setUser: (state, user) => state.user = user,
  setMarkets: (state, markets) => {
    state.markets_obj = markets.reduce((obj, item) => Object.assign(obj, { [item.id]: item }), {})
    state.markets = markets
  },
  setUserDeals: (state, deals) => state.userDeals = deals,
  setLiquidityPositions: (state, positions) => state.liquidityPositions = positions,

  setBaseUrl: (state, url) => state.baseUrl = url,
  setLoading: (state, loading) => state.loading = loading,
  setTokens: (state, tokens) => state.tokens = tokens,
  setAccount: (state, account) => state.account = account,
  setAccountLimits: (state, limits) => state.accountLimits = limits,
  setUserOrders: (state, orders) => state.userOrders = orders,
  setUserOrdersLoading: (state, loading) => state.userOrdersLoading = loading,
  setLihgHistoryBlock: (state, block) => state.lihgHistoryBlock = block,
  setBlockNum: (state, block) => state.blockNum = block,
}

// Move to notifications module (nee create it)
const playOrderMatchSound = debounce(() => {
  const audio = new Audio(require('~/assets/sounds/match.mp3'))
  audio.play()
}, 50)

const loadOrdersDebounce = {}

export const actions = {
  init({ dispatch, state, getters }) {
    dispatch('fetchTokens')

    if (state.network.name == 'local') return

    dispatch('loadMarkets')

    setInterval(() => dispatch('update'), 15000)

    this.$socket.on('connect_error', (err) => {
      console.log(`websocket connect_error due to ${err.message}`)
    })

    // TODO Move push notifications to other place
    this.$socket.on('match', match => {
      if (loadOrdersDebounce[match.market_id]) clearTimeout(loadOrdersDebounce[match.market_id])

      loadOrdersDebounce[match.market_id] = setTimeout(() => {
        dispatch('market/updatePairBalances', null, { root: true })
        dispatch('loadOrders', match.market_id)
      }, 500)

      const market = getters.markets.filter(m => m.id == match.market_id)[0]

      const notify_options = {}
      if (document.hidden) {
        notify_options.duration = 15000
      }

      if (match.bid) {
        this._vm.$notify({
          ...notify_options,
          title: `Order match - ${market.symbol}`,
          message: `${match.bid} ${market.base_token.symbol.name} at ${match.price}`,
          type: 'success'
        })
      } else {
        this._vm.$notify({
          ...notify_options,
          title: `Order match - ${market.symbol}`,
          message: `${match.ask} ${market.base_token.symbol.name} at ${match.price}`,
          type: 'success'
        })
      }

      // Play sound
      playOrderMatchSound()
    })
  },

  toggleTheme({ state, commit }) {
    this.$colorMode.preference = this.$colorMode.preference !== 'dark' ? 'dark' : 'light'
  },

  async fetchTokens({ commit }) {
    const { data: tokens } = await this.$axios.get('https://raw.githubusercontent.com/eoscafe/eos-airdrops/master/tokens.json')

    commit('setTokens', tokens)
  },

  update({ dispatch, state }) {
    const route = this._vm.$nuxt.$route.name
    if (!['trade-index-id', 'swap'].includes(route)) {
      dispatch('loadUserBalances')
    }

    dispatch('loadAccountData')
  },

  async loadAccountData({ state, commit, getters, dispatch }) {
    if (!state.user) return

    const account = await this.$rpc.get_account(state.user.name)
    commit('setAccount', account)
    commit('setBlockNum', account.head_block_num)

    if (account && account.core_liquid_balance) {
      // add core balance
      const amount = account.core_liquid_balance.split(' ')[0]

      commit('updateBalance', {
        id: state.network.baseToken.symbol + '@' + state.network.baseToken.contract,
        contract: state.network.baseToken.contract,
        currency: state.network.baseToken.symbol,
        decimals: state.network.baseToken.precision,
        amount
      })
    }
  },

  async loadAccountLimits({ commit, state }) {
    if (!state.user) return

    const { rows: [account] } = await this.$rpc.get_table_rows({
      code: state.network.contract,
      scope: state.network.contract,
      table: 'account',
      limit: 1,
      lower_bound: nameToUint64(state.user.name),
      upper_bound: nameToUint64(state.user.name)
    })

    if (account) commit('setAccountLimits', account)
  },

  async loadMarkets({ state, commit, getters, dispatch }) {
    const { data } = await this.$axios.get('/markets')
    data.map(m => {
      const { base_token, quote_token } = m

      m.symbol = quote_token.symbol.name + ' / ' + base_token.symbol.name
      m.slug = (quote_token.str + '_' + base_token.str).toLowerCase().replace(/@/g, '-')

      m.i256 = make256key(base_token.contract, base_token.symbol.name, quote_token.contract, quote_token.symbol.name)
    })
    commit('setMarkets', data)
  },

  async loadIbc({ state, commit, rootGetters }) {
    const { rows: ibcTokens } = await this.$rpc.get_table_rows({
      code: 'bosibc.io',
      scope: 'bosibc.io',
      table: 'accepts',
      limit: 1000
    })

    const tokens = [...new Set([...state.ibcTokens, ...ibcTokens.map(t => t.original_contract)])]

    commit('setIbcTokens', tokens)
    commit('setIbcAccepts', ibcTokens)
  },

  loadUserLiqudityPositions({ state, commit }) {
    this.$axios.get(`/account/${state.user.name}/liquidity_positions`).then(r => {
      commit('setLiquidityPositions', r.data)
    })
  },

  async loadUserOrders({ state, commit, dispatch }) {
    if (!state.user || !state.user.name) return

    const sellOrdersMarkets = state.accountLimits.sellorders.map(o => o.key)
    const buyOrdersMarkets = state.accountLimits.buyorders.map(o => o.key)

    const markets = new Set([...sellOrdersMarkets, ...buyOrdersMarkets])

    for (const market_id of markets) {
      await dispatch('loadOrders', market_id)
      await new Promise(resolve => setTimeout(resolve, 250))
    }
    commit('setUserOrdersLoading', false)
  },

  async loadOrders({ state, commit, dispatch }, market_id) {
    if (market_id == null) return console.error('LoadOrders for NULL market!') // FIXME Happends on first load
    if (!state.user || !state.user.name) return

    const { name } = state.user

    await Promise.all([
      dispatch('api/getBuyOrders', {
        market_id,
        key_type: 'i64',
        index_position: 3,
        lower_bound: nameToUint64(name),
        upper_bound: nameToUint64(name)
      }, { root: true }),

      dispatch('api/getSellOrders', {
        market_id,
        key_type: 'i64',
        index_position: 3,
        lower_bound: nameToUint64(name),
        upper_bound: nameToUint64(name)
      }, { root: true })
    ]).then(([buyOrders, sellOrders]) => {
      buyOrders.map(o => {
        o.type = 'buy'
        o.market_id = market_id
      })
      sellOrders.map(o => {
        o.type = 'sell'
        o.market_id = market_id
      })

      // TODO Need optimization so much!
      commit('setUserOrders', state.userOrders.filter(o => o.market_id != market_id).concat(buyOrders.concat(sellOrders)))
    }).catch(e => console.log(e))
  },

  async updateBalance({ state, commit, getters, dispatch }, { contract, symbol }) {
    if (!state.user) return

    const balance = await this.$rpc.get_currency_balance(contract, state.user.name, symbol)
    if (!balance[0]) return


    const asset = parseAsset(balance[0])

    commit('updateBalance', {
      id: symbol + '@' + contract,
      contract,
      currency: symbol,
      decimals: asset.symbol.precision,
      amount: asset.prefix
    })
  },

  async loadLPTBalances({ state, commit }) {
    if (!state.user) return

    const { rows } = await this.$rpc.get_table_rows({
      code: state.network.pools.contract,
      scope: state.user.name,
      table: 'accounts',
      limit: 1000
    })

    const balances = state.user.balances.filter(b => b.contract != state.network.pools.contract)
    commit('setUser', { ...state.user, balances })

    rows.map(r => {
      const asset = parseAsset(r.balance)

      commit('updateBalance', {
        id: asset.symbol.symbol + '@' + 'alcorammswap',
        contract: 'alcorammswap',
        currency: asset.symbol.symbol,
        decimals: asset.symbol.precision,
        amount: asset.prefix
      })
    })
  },

  async loadUserBalances({ dispatch }) {
    try {
      await dispatch('loadUserBalancesLightAPI')
    } catch (e) {
      console.log('Getting balances from LightAPI failed:', e)
      console.log('Try with hyperion', e)
      await dispatch('loadUserBalancesHyperion')
    }
  },

  async loadUserBalancesLightAPI({ state, rootState, commit }) {
    if (state.user) {
      //this.$axios.get(`${state.network.lightapi}/api/balances/${state.network.name}/${rootState.user.name}`).then((r) => {
      // FIXME Почему то нукстовский аксиос не работает для телефонов
      const r = await axios.get(`${state.network.lightapi}/api/balances/${state.network.name}/${state.user.name}`)

      // Check sync is correct
      const block_time = new Date(r.data.chain.block_time + ' UTC')
      const diff = (new Date().getTime() - block_time.getTime()) / 1000

      if (diff > 60) throw new Error('LightAPI sync is more the one minute out.')

      const balances = r.data.balances.filter(b => parseFloat(b.amount) > 0)
      commit('setLihgHistoryBlock', r.data.chain.block_num)

      // TODO Refactor this and make separate filter/computed for getting token in USD
      // Calc USD value
      balances.map(token => {
        token.id = token.currency + '@' + token.contract

        const { systemPrice } = rootState.wallet
        const market = state.markets.filter(m => {
          return m.base_token.contract == state.network.baseToken.contract &&
            m.quote_token.contract == token.contract &&
            m.quote_token.symbol.name == token.currency
        })[0]

        if (market) {
          token.usd_value = (parseFloat(token.amount) * market.last_price) * systemPrice
        } else {
          token.usd_value = 0
        }

        if (token.contract == state.network.baseToken.contract) {
          token.usd_value = parseFloat(token.amount) * systemPrice
        }

        commit('updateBalance', token)
      })
    }
  },

  // Using Hyperion
  async loadUserBalancesHyperion({ state, rootState, commit }) {
    console.log('loadUserBalances..')
    if (state.user) {
      // TODO Вынести этот эндпоинт в конфиг
      //this.$axios.get(`${state.network.lightapi}/api/balances/${state.network.name}/${rootState.user.name}`).then((r) => {
      // FIXME Почему то нукстовский аксиос не работает для телефонов
      const r = await axios.get(`${state.network.hyperion}/v2/state/get_tokens`, { params: { account: rootState.user.name } })
      const balances = r.data.tokens.filter(b => parseFloat(b.amount) > 0)

      //balances.sort((a, b) => {
      //  if (a.contract == 'eosio.token' || b.contract == 'eosio.token') { return -1 }
      //  return 1
      //})

      // TODO Refactor this and make separate filter/computed for getting token in USD
      // Calc USD value
      balances.map(token => {
        if (!token.precision) token.precision = 0
        token.currency = token.symbol
        token.decimals = token.precision
        token.id = token.currency + '@' + token.contract

        const { systemPrice } = rootState.wallet
        const market = state.markets.filter(m => {
          return m.base_token.contract == state.network.baseToken.contract &&
            m.quote_token.contract == token.contract &&
            m.quote_token.symbol.name == token.currency
        })[0]

        if (market) {
          token.usd_value = (parseFloat(token.amount) * market.last_price) * systemPrice
        } else {
          token.usd_value = 0
        }

        if (token.contract == state.network.baseToken.contract) {
          token.usd_value = parseFloat(token.amount) * systemPrice
        }
      })

      balances.sort((a, b) => {
        if (a.contract == 'eosio.token' || b.contract == 'eosio.token') { return -1 }

        return 0
      })

      balances.map(b => commit('updateBalance', b))
    }
  },

  async fetchUserDeals({ state, commit }) {
    // TODO Rm this if not userd
    if (!state.user) return

    const { data: deals } = await this.$axios.get(`/account/${state.user.name}/deals`)
    commit('setUserDeals', deals)
  }
}

export const getters = {
  userOrders: state => state.userOrders,

  markets(state) {
    return state.markets
  },

  user(state) {
    return state.user
  },

  systemBalance(state) {
    const { symbol, contract } = state.network.baseToken

    if (state.user && state.user.balances) {
      const systemBalance = state.user.balances.filter(b => {
        return b.currency === symbol && b.contract === contract
      })[0]

      if (systemBalance) return parseFloat(systemBalance.amount).toFixed(4) + ' ' + symbol
    }

    return `0.0000 ${symbol}`
  },

  knownTokens(state) {
    const tokens = []

    state.markets.map(m => {
      tokens.push(m.quote_token)
    })

    return tokens
  }
}
