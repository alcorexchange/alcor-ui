import JSBI from 'jsbi'

import { FeeAmount, PositionLibrary, TickLibrary, CurrencyAmount, Token } from '~/assets/libs/swap-sdk'

export const state = () => ({
  tokenA: null,
  tokenB: null,

  feeAmount: FeeAmount.MEDIUM,
  liquidity: 30
})

export const mutations = {
  setTokenA: (state, token) => state.tokenA = token,
  setTokenB: (state, token) => state.tokenB = token,
  setFeeAmount: (state, value) => state.feeAmount = parseInt(value)
}

export const actions = {
  async init({ dispatch }) {
    //await dispatch('fetchPairs')
    //await dispatch('fetchCoins')
  },

  updateRoutePath({ state, getters, rootState }) {
    // TODO Handle fee!
    const { tokenA, tokenB } = getters.routes

    let path = '/add-liquidity/'

    if (state.tokenA && state.tokenA.name !== tokenA) {
      path += state.tokenA
    }

    if (!state.tokenA && state.tokenB && state.tokenB !== tokenB) {
      path += state.tokenB
    }

    if (state.tokenB && state.tokenB !== tokenB) {
      path += `/${state.tokenB}`
    }

    if (state.tokenA && state.tokenB && state.feeAmount) {
      path += `/${state.feeAmount}`
    }

    const currentRout = rootState.route.fullPath
    console.log({ currentRout, path })
    if (currentRout !== path) this.$router.push({ path })
  },

  setTokenA({ state, dispatch, commit }, token) {
    if (token.name == state.tokenB?.name) commit('setTokenB', null)
    commit('setTokenA', token)
    //dispatch('updateRoutePath')
  },

  setTokenB({ state, dispatch, commit }, token) {
    if (token.name == state.tokenA?.name) return commit('setTokenB', null)

    commit('setTokenB', token)
    //dispatch('updateRoutePath')
  },

  async getPositionFees(_, { position, pool }) {
    if (!position || !pool) return
    // TODO Update position
    // await this.$store.dispatch('amm/fetchPositions')

    const { liquidity, upper, lower, feeGrowthInsideALastX64, feeGrowthInsideBLastX64 } = position

    console.log(position)
    console.log({ liquidity, upper, lower, feeGrowthInsideALastX64, feeGrowthInsideBLastX64 })
    return

    const tickLower = pool.ticks.find(t => t.id == lower)
    const tickUpper = pool.ticks.find(t => t.id == upper)

    const feeGrowthOutsideLower = {
      feeGrowthOutsideAX64: JSBI.BigInt(tickLower.feeGrowthOutsideAX64),
      feeGrowthOutsideBX64: JSBI.BigInt(tickLower.feeGrowthOutsideBX64)
    }

    const feeGrowthOutsideUpper = {
      feeGrowthOutsideAX64: JSBI.BigInt(tickUpper.feeGrowthOutsideAX64),
      feeGrowthOutsideBX64: JSBI.BigInt(tickUpper.feeGrowthOutsideBX64)
    }

    const { feeGrowthGlobalAX64, feeGrowthGlobalBX64 } = pool

    const [feeGrowthInsideAX64, feeGrowthInsideBX64] = TickLibrary.getFeeGrowthInside(
      feeGrowthOutsideLower,
      feeGrowthOutsideUpper,
      lower,
      upper,
      pool.currSlot.tick,
      JSBI.BigInt(feeGrowthGlobalAX64),
      JSBI.BigInt(feeGrowthGlobalBX64)
    )

    console.log({ feeGrowthInsideAX64, feeGrowthInsideBX64 })

    const [tokensOwnedA, tokensOwnedB] = PositionLibrary.getTokensOwed(
      JSBI.BigInt(feeGrowthInsideALastX64),
      JSBI.BigInt(feeGrowthInsideBLastX64),
      JSBI.BigInt(liquidity),
      feeGrowthInsideAX64,
      feeGrowthInsideBX64
    )

    const currencyA = new Token('eosio.token', 4, 'A', 'tokenA')
    const currencyB = new Token('eosio.token', 4, 'B', 'tokenA')

    const feesA = CurrencyAmount.fromRawAmount(currencyA, tokensOwnedA)
    const feesB = CurrencyAmount.fromRawAmount(currencyB, tokensOwnedB)

    return { feesA, feesB }
  },

  async fetchPairs({ state, commit, rootGetters, dispatch }) {
    //const { data: { data: pairs } } = await this.$axios.get('/coinswitch/pairs')
    //commit('setPairs', pairs.filter(p => p.isActive))
  }
}

export const getters = {
  tokenA: (state, getters) => getters.tokens.find(t => t.name == state.tokenA?.name),
  tokenB: (state, getters) => getters.tokens.find(t => t.name == state.tokenB?.name),

  tokens(state, getters, rootState, rootGetters) {
    // Тут вообще все
    const tokens = []

    rootGetters['amm/pools'].map(p => {
      const { tokenA, tokenB } = p

      if (tokens.filter(t => t.name == tokenA.name).length == 0) tokens.push(tokenA)
      if (tokens.filter(t => t.name == tokenB.name).length == 0) tokens.push(tokenB)
    })

    return tokens
  },

  pool(state, getters, rootState, rootGetters) {
    if (!state.tokenA || !state.tokenB) return null

    const pool = rootGetters['amm/pools'].find(p => {
      return (
        (p.tokenA.name == state.tokenA?.name && p.tokenB.name == state.tokenB?.name) ||
        (p.tokenA.name == state.tokenB?.name && p.tokenB.name == state.tokenA?.name)
      ) && p.fee == state.feeAmount
    })

    return pool
  },

  routes(state, getters, rootState) {
    const [tokenA, tokenB, feeAmountFromUrl] = rootState
      .route.fullPath.replace('/add-liquidity/', '').split('/')

    return { tokenA, tokenB, feeAmountFromUrl }
  }
}
