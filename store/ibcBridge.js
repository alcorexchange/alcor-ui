import { SymbolCode } from 'eos-common'
import { getMultyEndRpc } from '../utils/eosjs'
import { IBC_NETWORKS } from '~/config'
import { nameToUint64 } from '~/utils'

export const state = () => ({
  pairs: [],
  loading: true,
  chains: [],

  step: null,
  tx: null,
  packedTx: null,
  error: null,
  proofs: null,
  asset: null,

  result: {},

  sourceName: null,
  destinationName: null
})

export const mutations = {
  setLoading: (state, value) => state.loading,
  setChains: (state, chains) => state.chains = chains,
  setDestinationName: (state, chain) => state.destinationName = chain,
  setSourceName: (state, chain) => state.sourceName = chain,
  setStep: (state, chain) => state.step = chain,
  setTx: (state, tx) => state.tx = tx,
  setPackedTx: (state, tx) => state.packedTx = tx,
  setError: (state, error) => state.error = error,
  setResult: (state, result) => state.result = result,
  setProofs: (state, result) => state.proofs = result,
  setAsset: (state, asset) => state.asset = asset
}

export const actions = {
  init({ state, commit, dispatch, rootState, rootGetters, getters }) {
    const chains = IBC_NETWORKS

    for (const chain of chains) {
      chain.session = null
      chain.symbols = null
      chain.auth = null
      chain.wrapLockContracts = []

      chain.rpc = getMultyEndRpc(Object.keys(chain.client_nodes))
    }

    commit('setChains', chains)
    dispatch('fetchTokens')
  },

  async fetchTokens({ state, commit }) {
    const promises = []
    const tokenPromises = []
    const groupedResults = []
    const allWraplockContracts = []

    const { chains } = state

    for (const chain of chains) {
      chain.session = null
      chain.symbols = null
      chain.auth = null
      chain.wrapLockContracts = []

      chain.rpc = getMultyEndRpc(Object.keys(chain.client_nodes))
    }

    let sourceName, destinationName, tokenRow, fetchProgress = 0, progressInterval

    for (const chain of chains) for (const wrapLockContract of chain.ibc.wrapLockContractsArray) {
      allWraplockContracts.push(wrapLockContract)

      promises.push(
        chain.rpc.get_table_rows({ code: wrapLockContract, scope: wrapLockContract, table: 'global' }),
        chain.rpc.get_table_rows({ code: wrapLockContract, scope: wrapLockContract, table: 'contractmap' })
      )
    }

    const initialResults = (await Promise.all(promises)).map(r => r.rows)
    while (initialResults.length) groupedResults.push(initialResults.splice(0, 2))

    for (const result of groupedResults) {
      const global = result[0][0]
      const contractMaps = result[1]

      for (const map of contractMaps) {
        const chain = chains.find(c => c.chainId === global.chain_id)
        if (!chain) continue
        tokenPromises.push(chain.rpc.get_table_by_scope({ code: map.native_token_contract, table: 'stat' }))
      }
    }

    const tokenResults = await Promise.all(tokenPromises)

    let tokenResultsIndex = 0

    for (const result of groupedResults) {
      const global = result[0][0]
      const contractMaps = result[1]

      for (const map of contractMaps) {
        const chain = chains.find(c => c.chainId === global.chain_id)
        const pairedChain = chains.find(c => c.chainId === global.paired_chain_id)

        if (!chain) continue

        const symbolsres = tokenResults[tokenResultsIndex]

        const symbols = symbolsres.rows.map(r => new SymbolCode(Number(nameToUint64(r.scope))).toString())

        console.log(`${chain.name} -> ${pairedChain.name} tokens: ${symbols}`)
        chain.wrapLockContracts.push({
          chain_id: global.chain_id,
          wrapLockContract: allWraplockContracts[tokenResultsIndex],
          nativeTokenContract: map.native_token_contract,
          pairedChainId: global.paired_chain_id,
          pairedWrapTokenContract: map.paired_wraptoken_contract,
          symbols
        })

        tokenResultsIndex++
      }
    }

    commit('setChains', chains)
  }
}

export const getters = {
  availableAssets(state, getters, rootState) {
    if (!getters.source || !getters.destination) return []

    //if (sourceName === destinationName || !destinationName){
    //  destinationChain = chains.find(c=>c.name !== sourceName);
    //  $("#destinationChain").val(destinationChain.name);
    //}

    let id = 1, nativeList = [], wrappedList = []

    for (const row of getters.source.wrapLockContracts.filter(r => r.pairedChainId == getters.destination.chainId)) {
      for (const symbol of row.symbols) {
        nativeList.push({
          ...row,
          id,
          symbol,
          sourceTokenContract: row.nativeTokenContract,
          destinationTokenContract: row.pairedWrapTokenContract,
          native: true
        })

        id++
      }
    }

    nativeList = nativeList.sort((a, b) => (a.symbol > b.symbol ? 1 : -1))

    id = 1000

    for (const row of getters.destination.wrapLockContracts.filter(r => r.pairedChainId == getters.source.chainId)) {
      for (const symbol of row.symbols) {
        wrappedList.push({
          ...row,
          id,
          symbol,
          sourceTokenContract: row.pairedWrapTokenContract,
          destinationTokenContract: row.nativeTokenContract,
          native: false
        })

        id++
      }
    }

    wrappedList = wrappedList.sort((a, b) => (a.symbol > b.symbol ? 1 : -1))

    return [...nativeList, ...wrappedList]
  },

  source(state) {
    return state.chains.find(c => c.name == state.sourceName)
  },

  destination(state) {
    return state.chains.find(c => c.name == state.destinationName)
  }
}
