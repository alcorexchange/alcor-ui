<template lang="pug">
#swap-page.mt-5(:class="{ showChart }")
  SwapWidget.swap-widget-container(@chart="setShowChart(!showChart)")
  transition(name="width")
    .chart-container(v-if="showChart")
      SwapChart
</template>

<script>
import { mapGetters, mapMutations } from 'vuex'
import SwapWidget from '~/components/amm/SwapWidget'
import SwapChart from '~/components/amm/SwapChart'

export default {
  components: {
    SwapWidget,
    SwapChart
  },
  computed: {
    ...mapGetters({
      showChart: 'amm/swap/showChart'
    })
  },
  methods: {
    ...mapMutations({
      setShowChart: 'amm/swap/setShowChart'
    })
  }
}
</script>

<style lang="scss" scoped>
#swap-page{
  display: flex;
  align-items: flex-start;
  justify-content: center;
  gap: 0;
  &.showChart {
    gap: 8px;
  }
  transition: gap 0.1s;
}
.swap-widget-container {
  max-width: 450px;
}
</style>
<style lang="scss">
.chart-container{
  transition: all 0.1s;
  overflow: hidden;
  flex: 1;
}
.width-enter,
.width-leave-to {
  flex: 0.001;
  opacity: 0;
}
</style>
