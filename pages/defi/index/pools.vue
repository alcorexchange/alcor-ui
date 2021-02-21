<template lang="pug">
.row.justify-content-center.mt-3
  .col-lg-10
    el-card
      .lead Swap tokens using Alcor Pools

      create
      liquidity
      withdraw

      swap(v-if="tab == 'Swap'")

</template>

<script>
import Swap from '~/components/swap/Swap.vue'
import Create from '~/components/pools/Create.vue'
import Liquidity from '~/components/pools/Liquidity.vue'
import Withdraw from '~/components/pools/Withdraw.vue'

export default {
  components: {
    Swap,
    Create,
    Liquidity,
    Withdraw
  },

  fetch({ store }) {
    store.commit('swap/setInput', store.state.network.baseToken)
  },

  data() {
    return {
      tab: 'Swap'
    }
  }
}
</script>

<style scoped>
</style>
