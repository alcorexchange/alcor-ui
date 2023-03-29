<template lang="pug">
#swap-page.mt-5(:class="{ showChart }")
  SwapWidget.swap-widget-container(@onChartClick="onChart")

  client-only
    .chart-container(v-if="showChart")
      SwapChart()
</template>

<script>
import { mapGetters } from 'vuex'
import SwapWidget from '~/components/amm/SwapWidget'
import SwapChart from '~/components/amm/SwapChart'

export default {
  components: {
    SwapWidget,
    SwapChart
  },

  computed: {
    showChart: {
      get() {
        return this.$store.state.amm.swap.showChart
      },

      set(val) {
        this.$store.commit('amm/swap/setShowChart', val)
      }
    },
    ...mapGetters('amm/swap', [
      'tokenA',
      'tokenB',
    ]),
  },

  methods: {
    onChart() {
      this.showChart = !this.showChart
    },
  },
}
</script>

<style lang="scss" scoped>
#swap-page{
  display: flex;
  align-items: flex-start;
  justify-content: center;
  gap: var(--amm-space-1);
}
.swap-widget-container {
  max-width: 450px;
}
</style>
<style lang="scss">
.chart-container{
  flex: 1;
}
</style>
