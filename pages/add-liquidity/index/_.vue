<template lang="pug">
.empty-div
</template>

<script>
// This manages pool tokens selected and fee
import { Name, SymbolCode } from 'eos-common'
import { mapState, mapActions } from 'vuex'

export default {
  name: 'AddLiquidityParams',

  // Force trailing slash
  fetch({ route, redirect, store }) {
    // TODO Regex test
    if (route.path[route.path.length - 1] !== '/') redirect(route.path + '/')

    const { tokenA, tokenB, feeAmountFromUrl } = store.getters['amm/addLiquidity/routes']

    if (tokenA) store.commit('amm/addLiquidity/setTokenA', tokenA)
    if (tokenB) store.commit('amm/addLiquidity/setTokenB', tokenB)
    if (feeAmountFromUrl) store.commit('amm/addLiquidity/setFeeAmount', feeAmountFromUrl)
  },

  beforeRouteLeave(to, from, next) {
    next()
  },

  beforeRouteUpdate(to, from, next) {
    next()
  },

  computed: {
    ...mapState('market', ['id', 'symbol', 'quote_token', 'base_token'])
  },

  methods: {
    ...mapActions('market', ['clearField'])
  }
}
</script>
