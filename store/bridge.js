// import { SymbolCode } from 'eos-common'
// import { getAllLockContracts } from '../utils/ibc'
// import { getMultyEndRpc } from '../utils/eosjs'
// import { IBC_NETWORKS } from '~/config'
// import { nameToUint64 } from '~/utils'

const routes = {
  // connected chains, structured by => from: [to,]
  eos: ['wax', 'telos', 'ux'],
  wax: ['wax', 'telos', 'ux', 'solana'],
  solana: ['wax'],
}

const tokens = {
  // availabe tokens structured by => source-destination: [token-id,]
  'wax-sol': ['wuf-wuffi'],
  'sol-wax': ['wuf-wuffi'],
}

export const state = () => ({
  sourceName: null,
  destinationName: null
})

export const mutations = {
  //setAsset: (state, asset) => state.asset = asset
}

export const actions = {
  init({ state, commit, dispatch, rootState, rootGetters, getters }) {
  }
}

export const getters = {
}
