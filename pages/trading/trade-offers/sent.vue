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
    '$store.state.user'(v) {
      v && this.getSendedOffers()
    }
  },
  mounted() {
    this.$store.state.user?.name && this.getSendedOffers()
  },
  methods: {
    ...mapActions('api', ['getTradeOffers']),
    async getSendedOffers() {
      const filters = this.$cookies.get('global_tradeoffers_filters')
      this.tradeOffers = await this.getTradeOffers({
        filters: {
          ...filters,
          hide_contracts: !filters.hide_contracts
        },
        type: 'sender'
      })
    }
  }
}
</script>
