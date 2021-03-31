<template lang="pug">
.row
  .col
    swap
</template>

<script>
import Swap from '~/components/pools/Swap'

export default {
  components: {
    Swap
  },

  async fetch({ error, redirect, store, route, params }) {
    if (process.server) return
    if (store.state.pools.pools.length == 0) {
      await store.dispatch('pools/fetchPools')
    }

    const pools = store.getters['pools/pools']

    const selected_pool = pools.filter(p => {
      const sym1 = `${p.pool1.contract}-${p.pool1.quantity.symbol.code().to_string().toLowerCase()}`
      const sym2 = `${p.pool2.contract}-${p.pool2.quantity.symbol.code().to_string().toLowerCase()}`

      return `${sym1}_${sym2}` == params.pool
    })

    if (selected_pool.length > 0) {
      store.commit('pools/setCurrentSym', selected_pool[0].supply.symbol.code().to_string())
    } else {
      error({ statusCode: 404, message: 'Pool not found..' })
    }
  }

  //head() {
  //  return {
  //    title: `Alcor.exchange | Liquidity pools`,

  //    meta: [
  //      { hid: 'description', name: 'description', content: `Swap tokens or make income on liquidity providing` }
  //    ]
  //  }
  //}
}
</script>

<style scoped>
.pools-list {
  max-height: calc(100vh - 200px);
  overflow: auto;
}
</style>
