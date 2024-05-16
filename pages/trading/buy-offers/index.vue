<template lang="pug">
#buy-offers-page.py-3.py-lg-5
  buy-offers(v-if="$store.state.user")
  span(v-else) not auth

</template>

<script>
import BuyOffers from '~/components/trading/BuyOffers.vue'

export default {
  components: {
    BuyOffers
  }
}
</script>
