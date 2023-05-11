<template lang="pug">
  SwapWidget.swap-widget-container
</template>

<script>
import SwapWidget from '~/components/amm/SwapWidget'

export default {
  layout: 'swap-widget',

  components: {
    SwapWidget
  }
}
</script>

<style>
.swap-widget-container {
  max-width: 450px;
  width: 100%;
}
</style>

