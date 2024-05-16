<template lang="pug">
#history-page.py-3.py-lg-5
  history(v-if="$store.state.user")
  span(v-else) not auth

</template>

<script>
import History from '~/components/trading/History.vue'

export default {
  components: {
    History
  }
}
</script>
