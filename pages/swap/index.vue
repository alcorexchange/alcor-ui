<template lang="pug">
.swap-page-container
  SwapBackground
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
import SwapBackground from '~/components/amm/SwapBackground'

export default {
  components: {
    SwapWidget,
    SwapChart,
    SwapBackground
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
  display: grid;
  align-items: flex-start;
  grid-template-columns: 1fr;
  gap: var(--amm-space-1);
  justify-items: center;
  position: relative;
  z-index: 2;
  &.showChart {
    grid-template-columns: 450px 1fr;
  }
}
.swap-widget-container {
  max-width: 450px;
  width: 100%;
}
.chart-container {
  width: 100%
}
@media only screen and (max-width: 1080px) {
  #swap-page {
    grid-template-columns: 1fr;
    &.showChart {
      grid-template-columns: 1fr;
    }
  }
}
@media only screen and (max-width: 680px) {
  .swap-widget-container {
    max-width: 100%;
  }
}
</style>
