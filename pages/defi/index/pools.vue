<template lang="pug">
.row.justify-content-center.mt-3
  .col-lg-10
    el-card
      .lead Swap tokens using Defibox

      swap(v-if="tab == 'Swap'")

</template>

<script>
import Swap from '~/components/swap/Swap.vue'

export default {
  components: {
    Swap
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
