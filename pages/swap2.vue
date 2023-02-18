<template lang="pug">
.d-flex.align-items-center.align-items-lg-start.flex-column.flex-lg-row.gap-32.w-100.mt-3
  swap-widget.mt-4
  nuxt-child.mt-4
</template>

<script>
import SwapWidget from '~/components/amm/SwapWidget.vue'

export default {
  components: { SwapWidget },

  fetch({ route, redirect }) {
    if (route.path == '/swap2') redirect('/swap2/swap-tokens')
  }

  //mounted() {
  //  if (this.$route.path == '/swap2') this.$router.push('/swap2/swap-tokens')
  //}
}
</script>
