<template lang="pug">
.row.mt-3
  .col-lg-4
    el-card
      el-radio-group(v-model="tab").el-radio-full-width
        el-radio-button(label='Swap')
        el-radio-button(label='Liquidity')

      keep-alive
        component(v-bind:is="tab")
  .col-lg-8
    el-card(v-if="tab == 'Swap'")
      .lead Chart (will be available soon...)
    el-card(v-else)
      LiquidityPositions

</template>

<script>
import Swap from '~/components/swap/Swap.vue'
import Liquidity from '~/components/swap/Liquidity.vue'
import LiquidityPositions from '~/components/swap/LiquidityPositions.vue'

export default {
  components: {
    Swap,
    Liquidity,
    LiquidityPositions
  },

  fetch({ store }) {
    store.commit('swap/setInput', store.state.network.baseToken)
  },

  data() {
    return {
      tab: 'Swap'
    }
  },

  methods: {
    changeTab() {
      console.log('change tab..', this.tab)
    }
  }
}
</script>

<style scoped>
</style>
