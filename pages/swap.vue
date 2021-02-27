<template lang="pug">
.row.mt-3
  .col-lg-4
    el-card.mb-3.swap-card
      el-radio-group(v-model="tab" size="small").el-radio-full-width
        el-radio-button(label='Swap')
        el-radio-button(label='+ Liquidity')
        el-radio-button(label='- Liquidity')

      keep-alive
        component(v-bind:is="tabComponent")
  .col-lg-8
    .pools-chart(v-if="tab == 'Swap'")
      el-card.h-100
        Chart.h-100
    el-card(v-else)
      LiquidityPositions

</template>

<script>
import Swap from '~/components/swap/Swap.vue'
import Chart from '~/components/swap/Chart.vue'
import AddLiquidity from '~/components/swap/AddLiquidity.vue'
import RemoveLiquidity from '~/components/swap/RemoveLiquidity.vue'
import LiquidityPositions from '~/components/swap/LiquidityPositions.vue'

export default {
  components: {
    Swap,
    Chart,
    AddLiquidity,
    RemoveLiquidity,
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

  computed: {
    tabComponent() {
      if (this.tab == '+ Liquidity') return 'AddLiquidity'
      if (this.tab == '- Liquidity') return 'RemoveLiquidity'

      return 'Swap'
    }
  },

  methods: {
    changeTab() {
      console.log('change tab..', this.tab)
    }
  }
}
</script>

<style lang="scss">
.el-card.swap-card {
  overflow: visible;
}

.pools-chart {
  height: calc(100% - 16px);

  .el-card__body {
    height: 100%;
    padding: 5px;
  }
}
</style>
