<template lang="pug">
#trade-offers-sent-page.d-flex.flex-column
  trade-offer-list-item(v-for="offer in tradeOffers" :offer="offer")

</template>

<script>
import { mapActions } from 'vuex'
import TradeOfferListItem from '~/components/trade-offer/TradeOfferListItem.vue'

export default {
  components: { TradeOfferListItem },
  data: () => ({ tradeOffers: null }),
  watch: {
    '$route.query'() {
      this.getSendedOffers()
    }
  },
  mounted() {
    this.getSendedOffers()
  },
  methods: {
    ...mapActions('api', ['getTradeOffers']),
    async getSendedOffers() {
      this.tradeOffers = await this.getTradeOffers({
        filters: {
          ...this.$route.query,
          hide_contracts:
            this.$route.query.hide_contracts === 'false' ? 'true' : 'false'
        },
        type: 'sender'
      })
    }
  }
}
</script>
