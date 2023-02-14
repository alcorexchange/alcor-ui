<template lang="pug">
.d-flex.gap-32.w-100.mt-3
  swap-widget
  nuxt-child
</template>

<script>
import SwapWidget from '~/components/amm/SwapWidget.vue'

export default {
  components: { SwapWidget },
  mounted() {
    this.$router.push('/swap2/swap-tokens')
  }
}
</script>
