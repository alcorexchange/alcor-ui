<template lang="pug">
SwapWidget
</template>

<script>
import SwapWidget from '@/components/amm/SwapWidget'
export default {
  components: {
    SwapWidget
  },

  // fetch({ store, route }) {
  //   const { input, output } = route.query

  //   if (input) {
  //     const [symbol, contract] = input.split('-')
  //     store.commit('amm/swap/setInput', { symbol, contract })
  //   }

  //   if (output) {
  //     const [symbol, contract] = output.split('-')
  //     store.commit('amm/swap/setOutput', { symbol, contract })
  //   }
  // },

}
</script>
