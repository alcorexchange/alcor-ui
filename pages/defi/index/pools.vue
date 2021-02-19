<template lang="pug">
.row.justify-content-center.mt-3
  .col-lg-10
    el-card
      .lead Swap tokens using Alcor Pools

      create

      swap(v-if="tab == 'Swap'")

</template>

<script>
import Swap from '~/components/swap/Swap.vue'
import Create from '~/components/pools/Create.vue'

export default {
  components: {
    Swap,
    Create
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
