<template lang="pug">
#trade-offers-page.py-3.py-lg-5
  trade-offers(v-if="$store.state.user")
  span(v-else) not auth

</template>

<script>
import TradeOffers from '~/components/trading/TradeOffers.vue'

export default {
  components: {
    TradeOffers
  }
}
</script>
