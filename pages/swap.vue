<template lang="pug">
.row.justify-content-center.mt-3
  .col-lg-6
    el-card
      .lead Swap tokens using Defibox
      //el-radio-group(v-model="tab").el-radio-full-width
        el-radio-button(label='Swap')
        el-radio-button(label='Liquidity')

      swap(v-if="tab == 'Swap'")

</template>

<script>
import Swap from '~/components/swap/Swap.vue'

export default {
  components: {
    Swap
  },

  fetch({ store }) {
    console.log('fetch inin swap')
    store.commit('swap/setInput', store.state.network.baseToken)
    console.log('inpt', store.state.swap.input)
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
