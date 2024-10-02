// TODO Module needs fucking refactoring.
import axios from 'axios'
import debounce from 'lodash/debounce'
import findIndex from 'lodash/findIndex'

import { parseToken } from '~/utils/amm'
import { parseAsset, make256key, nameToUint64 } from '~/utils'

export const strict = false

export const state = () => ({
  user: null,
  //user: { name: 'liquid.mars' },
  userBalances: [],
  userDeals: [],
  userOrders: [],
  userOrdersLoading: true,
  account: null,
  liquidityPositions: [], // v1 old pool

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
  tokenLogos: [],
  eosAirdropTokens: [],
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

    // New balances logic
    state.userBalances = balances
    // TODO Transit to new userBalances property
  },

  setUser: (state, user) => {
    state.user = user
    if (user?.balances) {
      state.userBalances = user.balances
    }
  },

  setUserBalances: (state, balances) => {
    if (state.user) state.user.balances = balances
    state.userBalances = balances
  },

  setMarkets: (state, markets) => {
    state.markets_obj = markets.reduce((obj, item) => Object.assign(obj, { [item.id]: item }), {})
    state.markets = markets
  },

  setUserDeals: (state, deals) => state.userDeals = deals,
  setLiquidityPositions: (state, positions) => state.liquidityPositions = positions,

  setIbcTokens: (state, tokens) => state.ibcTokens = tokens,
  setBaseUrl: (state, url) => state.baseUrl = url,
  setLoading: (state, loading) => state.loading = loading,
  setTokens: (state, tokens) => state.tokens = tokens,
  setEosAirdropTokens: (state, tokens) => state.eosAirdropTokens = tokens,
  setAccount: (state, account) => state.account = account,
  setAccountLimits: (state, limits) => state.accountLimits = limits,
  setUserOrders: (state, orders) => state.userOrders = orders,
  setUserOrdersLoading: (state, loading) => state.userOrdersLoading = loading,
  setLihgHistoryBlock: (state, block) => state.lihgHistoryBlock = block,
  setBlockNum: (state, block) => state.blockNum = block
}

// Move to notifications module (nee create it)
const playOrderMatchSound = debounce(() => {
  const audio = new Audio(require('~/assets/sounds/match.mp3'))
  audio.play()
}, 50)

const loadOrdersDebounce = {}

export const actions = {
  // TODO
  // async nuxtServerInit({ dispatch }) {
  //   try {
  //     // TODO Make sure dns cached (it's server call)
  //     await dispatch('loadAllTokens')
  //   } catch (e) {
  //     console.error('SERVER API CALL ERR (loadAllTokens)', e)
  //   }
  // },

  init({ dispatch, state, getters, commit }) {
    dispatch('addIBCTokens')

    dispatch('loadAllTokens')
    dispatch('fetchEosAirdropTokens')

    if (state.network.name == 'local') return

    dispatch('loadMarkets')

    setInterval(() => dispatch('update'), 15000)

    this.$socket.on('connect_error', (err) => {
      console.log(`websocket connect_error due to ${err.message}`)
    })

    // TODO Move push notifications to other place
    this.$socket.on('match', (match) => {
      if (loadOrdersDebounce[match.market_id]) clearTimeout(loadOrdersDebounce[match.market_id])

      loadOrdersDebounce[match.market_id] = setTimeout(() => {
        dispatch('market/updatePairBalances', null, { root: true })
        dispatch('loadOrders', match.market_id)
      }, 500)

      const market = getters.markets.filter((m) => m.id == match.market_id)[0]

      const notify_options = {}
      if (document.hidden) {
        notify_options.duration = 15000
      }

      if (match.bid) {
        this._vm.$notify({
          ...notify_options,
          title: `Order match - ${market.symbol}`,
          message: `${match.bid} ${market.quote_token.symbol.name} at ${match.price}`,
          type: 'success',
        })
      } else {
        this._vm.$notify({
          ...notify_options,
          title: `Order match - ${market.symbol}`,
          message: `${match.ask} ${market.base_token.symbol.name} at ${match.price}`,
          type: 'success',
        })
      }

      // Play sound
      playOrderMatchSound()
    })
  },

  toggleTheme({ state, commit }) {
    this.$colorMode.preference = this.$colorMode.preference !== 'dark' ? 'dark' : 'light'
  },

  dynamicTheme({ state, commit }, radio_value) {
    this.$colorMode.preference = this.$colorMode.preference !== 'dark' ? 'dark' : radio_value
  },

  addIBCTokens({ state, commit }) {
    const wrapTokenContracts = Object.values(state.network?.ibc?.wrapTokenContracts || []).flat(1)
    commit('setIbcTokens', [...state.ibcTokens, ...wrapTokenContracts])
  },

  async fetchEosAirdropTokens({ commit }) {
    try {
      const { data } = await this.$axios.get(
        'https://raw.githubusercontent.com/eoscafe/eos-airdrops/master/tokens.json'
      )

      if (typeof data !== 'object') return

      commit('setEosAirdropTokens', data)
    } catch (e) {
      console.error('Fetching tokens from eos-airdrops', e)
    }
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
        amount,
      })
    }
  },

  async loadAccountLimits({ commit, state }) {
    if (!state.user) return

    const {
      rows: [account],
    } = await this.$rpc.get_table_rows({
      code: state.network.contract,
      scope: state.network.contract,
      table: 'account',
      limit: 1,
      lower_bound: nameToUint64(state.user.name),
      upper_bound: nameToUint64(state.user.name),
    })

    if (account) commit('setAccountLimits', account)
  },

  async loadAllTokens({ dispatch, commit, state }) {
    const { data: tokens } = await this.$axios.get('/v2/tokens')
    commit('setTokens', tokens)

    const { contract, symbol } = state.network.baseToken
    const system_token = tokens.find((t) => t.contract == contract && t.symbol == symbol)

    commit('wallet/setSystemPrice', system_token.usd_price, { root: true })
  },

  async loadMarkets({ state, commit, getters, dispatch }) {
    const { data } = await this.$axios.get('/markets')
    data.map((m) => {
      const { base_token, quote_token } = m

      m.symbol = quote_token.symbol.name + ' / ' + base_token.symbol.name
      m.slug = (quote_token.str + '_' + base_token.str).toLowerCase().replace(/@/g, '-') // TODO change to ticker_id
      m.promoted = state.network.PINNED_MARKETS.includes(m.id)
      m.scam = state.network.SCAM_CONTRACTS.includes(quote_token.contract)

      m.i256 = make256key(base_token.contract, base_token.symbol.name, quote_token.contract, quote_token.symbol.name)
    })
    commit('setMarkets', data)
  },

  setMarketsRelatedPool({ state, commit, getters }) {
    console.time('setMarketsRelatedPool')

    const pools = getters['amm/poolsPlainWithStatsAndUserData']
    const poolMap = new Map()

    // Создаем Map для быстрого поиска пулов по паре токенов
    pools.forEach((pool) => {
      const tokenAId = parseToken(pool.tokenA).id
      const tokenBId = parseToken(pool.tokenB).id
      const key1 = `${tokenAId}-${tokenBId}`
      const key2 = `${tokenBId}-${tokenAId}`

      // Сохраняем пул для обоих направлений пары токенов
      if (!poolMap.has(key1) || poolMap.get(key1)?.poolStats?.tvlUSD < pool.poolStats?.tvlUSD) {
        poolMap.set(key1, pool)
      }
      if (!poolMap.has(key2) || poolMap.get(key2)?.poolStats?.tvlUSD < pool.poolStats?.tvlUSD) {
        poolMap.set(key2, pool)
      }
    })

    const markets = state.markets.map((market) => {
      const { base_token, quote_token } = market
      const key = `${base_token.id}-${quote_token.id}`

      const relatedPool = poolMap.get(key)

      return { relatedPool, ...market }
    })

    commit('setMarkets', markets)
    console.timeEnd('setMarketsRelatedPool')
  },

  async loadUserOrders({ state, commit, dispatch }) {
    if (!state.user || !state.user.name) return

    try {
      const sellOrders = state.accountLimits.sellorders
      const buyOrders = state.accountLimits.buyorders
      const sellOrdersMarkets = Array.isArray(sellOrders) ? sellOrders.map((o) => o.key ?? o.first) : []
      const buyOrdersMarkets = Array.isArray(buyOrders) ? buyOrders.map((o) => o.key ?? o.first) : []

      const markets = new Set([...sellOrdersMarkets, ...buyOrdersMarkets])

      for (const market_id of markets) {
        await dispatch('loadOrders', market_id)
        await new Promise((resolve) => setTimeout(resolve, 250))
      }
    } catch (e) {
      console.error(e)
    } finally {
      commit('setUserOrdersLoading', false)
    }
  },

  async loadOrders({ state, commit, dispatch }, market_id) {
    if (market_id == null) return
    if (!state.user || !state.user.name) return

    const { name } = state.user

    await Promise.all([
      dispatch(
        'api/getBuyOrders',
        {
          market_id,
          key_type: 'i64',
          index_position: 3,
          lower_bound: nameToUint64(name),
          upper_bound: nameToUint64(name),
        },
        { root: true }
      ),

      dispatch(
        'api/getSellOrders',
        {
          market_id,
          key_type: 'i64',
          index_position: 3,
          lower_bound: nameToUint64(name),
          upper_bound: nameToUint64(name),
        },
        { root: true }
      ),
    ])
      .then(([buyOrders, sellOrders]) => {
        buyOrders.map((o) => {
          o.type = 'buy'
          o.market_id = market_id
        })
        sellOrders.map((o) => {
          o.type = 'sell'
          o.market_id = market_id
        })

        // TODO Need optimization so much!
        commit(
          'setUserOrders',
          state.userOrders.filter((o) => o.market_id != market_id).concat(buyOrders.concat(sellOrders))
        )
      })
      .catch((e) => console.log(e))
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
      amount: asset.prefix,
    })
  },

  async loadLPTBalances({ state, commit }) {
    if (!state.user) return

    const { rows } = await this.$rpc.get_table_rows({
      code: state.network.pools.contract,
      scope: state.user.name,
      table: 'accounts',
      limit: 1000,
    })

    const balances = state.user.balances.filter((b) => b.contract != state.network.pools.contract)
    commit('setUser', { ...state.user, balances })

    rows.map((r) => {
      const asset = parseAsset(r.balance)

      commit('updateBalance', {
        id: asset.symbol.symbol + '@' + 'alcorammswap',
        contract: 'alcorammswap',
        currency: asset.symbol.symbol,
        decimals: asset.symbol.precision,
        amount: asset.prefix,
      })
    })
  },

  async loadUserBalances({ dispatch }) {
    try {
      await dispatch('loadUserBalancesLightAPI')
      //await dispatch('loadUserBalancesHyperion')
    } catch (e) {
      // console.log('Getting balances from Hyperion failed:', e)
      // console.log('Try with LightAPI', e)
      // await dispatch('loadUserBalancesLightAPI')

      console.log('Getting balances from LightAPI failed:', e)
      console.log('Try with hyperion', e)
      await dispatch('loadUserBalancesHyperion')
    }
  },

  async loadAccountBalance({ state, rootState, commit }, accountName) {
    const { data } = await axios.get(`${state.network.lightapi}/api/balances/${state.network.name}/${accountName}`)
    const balances = data.balances.filter((b) => parseFloat(b.amount) > 0)

    return balances.map((token) => {
      token.id = token.currency + '@' + token.contract

      const { systemPrice } = rootState.wallet
      const market = state.markets.filter((m) => {
        return (
          m.base_token.contract == state.network.baseToken.contract &&
          m.quote_token.contract == token.contract &&
          m.quote_token.symbol.name == token.currency
        )
      })[0]

      if (market) {
        token.usd_value = parseFloat(token.amount) * market.last_price * systemPrice
      } else {
        token.usd_value = 0
      }

      if (token.contract == state.network.baseToken.contract) {
        token.usd_value = parseFloat(token.amount) * systemPrice
      }

      return token
    })
  },

  async loadUserBalancesLightAPI({ state, commit }) {
    if (!state.user) return

    try {
      const url = `${state.network.lightapi}/api/balances/${state.network.name}/${state.user.name}`
      const response = await axios.get(url)
      const data = response.data
      const blockTime = new Date(data.chain.block_time + ' UTC')
      const timeDiff = (new Date() - blockTime) / 1000

      if (timeDiff > 60) {
        throw new Error('LightAPI sync is more than one minute out.')
      }

      if (Array.isArray(data.balances) && data.balances.length) {
        // Использование Map ускоряет доступ к ценам токенов
        const tokenPrices = new Map(state.tokens.map((t) => [t.id, t.usd_price]))

        const balances = data.balances
          .filter((b) => parseFloat(b.amount) > 0)
          .map((token) => {
            const id = `${token.currency}@${token.contract}`
            const tokenKey = id.replace('@', '-').toLowerCase()
            const price = tokenPrices.get(tokenKey) || 0
            return {
              ...token,
              id,
              usd_value: parseFloat(token.amount) * price,
            }
          })

        commit('setLihgHistoryBlock', data.chain.block_num)
        commit('setUserBalances', balances)
      }
    } catch (error) {
      console.error('Error loading user balances:', error)
    }
  },

  // Using Hyperion
  async loadUserBalancesHyperion({ state, rootState, commit }) {
    console.log('loadUserBalances..')
    if (state.user) {
      const { data } = await axios.get(`${state.network.hyperion}/v2/state/get_tokens`, {
        params: { account: rootState.user.name, limit: 10000 },
      })

      if (Array.isArray(data?.tokens) && data.tokens.length) {
        const tokenPrices = new Map(state.tokens.map((t) => [t.id, t.usd_price]))

        const balances = data.tokens
          .filter((b) => parseFloat(b.amount) > 0)
          .map((token) => {
            const id = `${token.symbol}@${token.contract}`
            const tokenKey = id.replace('@', '-').toLowerCase()
            const price = tokenPrices.get(tokenKey) || 0

            return {
              ...token,
              id,
              currency: token.symbol,
              decimals: token.precision,
              usd_value: parseFloat(token.amount) * price,
            }
          })

        commit('setUserBalances', balances)
      }
    }
  },

  async fetchAccountDeals(_, accountName) {
    const { data: deals } = await this.$axios.get(`https://alcor.exchange/api/account/${accountName}/deals`, {
      params: { limit: 50 },
    })
    return deals
  },

  async fetchUserDeals({ state, commit }) {
    // TODO Rm this if not userd
    if (!state.user) return

    const { data: deals } = await this.$axios.get(`/account/${state.user.name}/deals`)
    commit('setUserDeals', deals)
  },
}

export const getters = {
  userOrders: state => state.userOrders,

  markets(state) {
    return state.markets
  },

  user(state) {
    return state.user
  },

  promoted(state, getters) {
    // TODO mock poolId now neet to implement in configs
    return getters.markets
      .filter(market => state.network.BANNER_MARKETS.includes(market.id))
      .map(market => ({
        ...market,
        poolId: market.id === 156 ? 765 : market.id === 495 ? 1831 : undefined
      })).reverse()
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
