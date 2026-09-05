<template lang="pug">
  SwapWidget(:hideBanner="true")
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
