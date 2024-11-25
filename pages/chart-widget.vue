<template lang="pug">
.h-100
  SwapChart
</template>

<script>
import SwapWidget from '~/components/amm/SwapWidget'
import SwapChart from '~/components/amm/SwapChart'

export default {
  layout: 'empty',

  components: {
    SwapWidget,
    SwapChart
  },

  fetch() {
    // fetch has access to `this`
    const { input, output, only, market } = this.$route.query

    if (input) {
      this.$store.commit('amm/swap/setInput', input.toLowerCase())
    }

    if (output) {
      this.$store.commit('amm/swap/setOutput', output.toLowerCase())
    }

    if (only) {
      const tokens = only.toLowerCase().split(',')
      this.$store.commit('amm/swap/setOnly', tokens)
    }

    if (market) {
      this.market = market
    }

    this.$store.dispatch('amm/swap/setDefaultInputOutput')
  }
}
</script>

<style>
html, body, #__nuxt, #__layout, #alcor-container {
  height: 100%;
  margin: 0;
  padding: 0;
}

#swap_tv_chart_container {
  min-height: 100px;
  height: 100%;
  /* height: 100% !important; */
  width: 100%;
}
</style>
