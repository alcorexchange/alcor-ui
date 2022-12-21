<template lang="pug">
#trade-offers-component
  history-trade-offer-filters.mt-2(:filters.sync="filters" :sorting.sync="sorting")
  .d-flex.gap-16.justify-content-between(v-if="tradeOffers.length")
    .d-flex.flex-column.gap-8.offer-list.mt-3
      .d-flex.flex-column.gap-8.mt-3
        trade-offer-list-item(
          :previewMode="true"
          v-for="offer in tradeOffers"
          :offer="offer"
          @click="preview(offer.offer_id)"
          :class="{ active: previewOffer && offer.offer_id === previewOffer.offer_id }"
        )
    .d-flex.flex-column.gap-16
      offer-preview(v-if="previewOffer" :offer="previewOffer" :previewMode="true")
      table-log(v-if="previewOffer && offerLog" :offerLog="offerLog")

</template>

<script>
import { mapActions } from 'vuex'
import HistoryTradeOfferFilters from '~/components/HistoryTradeOfferFilters'
import TradeOfferListItem from '~/components/trade-offer/TradeOfferListItem.vue'
import OfferPreview from '~/components/trading/OfferPreview'
import TableLog from '~/components/trading/TableLog'

export default {
  components: {
    HistoryTradeOfferFilters,
    TradeOfferListItem,
    OfferPreview,
    TableLog
  },
  data: () => ({
    tradeOffers: [],
    offerLog: null,
    sorting: { val: 'asc' },
    filters: {
      type: 'account',
      state: '3,4,5',
      after: null,
      before: null,
      show_invalid_offers: '0',
      hide_empty_offers: false,
      show_only_friends_offers: false,
      hide_contracts: false
    }
  }),
  computed: {
    previewOffer() {
      const previewId = this.$route.hash.split('-')[1]
      return (
        previewId &&
        this.tradeOffers.find(({ offer_id }) => offer_id === previewId)
      )
    },
    refetchProps() {
      ;[
        this.sorting.val,
        this.filters.type,
        this.filters.status,
        this.filters.after,
        this.filters.before,
        this.filters.show_invalid_offers,
        this.filters.hide_empty_offers,
        this.filters.show_only_friends_offers,
        this.filters.hide_contracts
      ]
      return Date.now()
    }
  },
  watch: {
    refetchProps() {
      this.$cookies.set('global_history_trade_offers_filters', this.filters)
      this.$cookies.set('global_history_trade_offers_sorting', this.sorting.val)
      this.getOffers()
    },
    '$route.hash'(v, old) {
      this.fetchOfferLog()
      if (v.split('-')[0] !== old.split('-')[0]) this.getOffers()
    }
  },
  mounted() {
    !this.$route.hash && this.$router.push({ hash: 'tradeoffers' })
    this.filters =
      this.$cookies.get('global_history_trade_offers_filters') || this.filters
    this.sorting.val = this.$cookies.get('global_history_trade_offers_sorting')
    this.getOffers()
  },
  methods: {
    ...mapActions('api', ['getTradeOffers', 'getOfferLog']),
    preview(id) {
      this.$router.push({ hash: 'tradeoffers' + '-' + id })
    },
    async fetchOfferLog() {
      const offerId = this.$route.hash.split('-')[1]

      if (offerId) {
        this.offerLog = await this.getOfferLog({
          offerId,
          options: {
            limit: '5',
            order: 'desc',
            page: '1'
          }
        })
      }
    },
    async getOffers() {
      const f = this.filters
      const options = {
        state: f.state
      }
      if (f.before) options.before = f.before
      if (f.after) options.after = f.after

      if (f.show_indalid_offer) options.show_indalid_offer = 'true'
      if (f.show_only_friends_offers) {
        options.show_only_friends_offers = 'true'
        options.recipient = 'none'
      }
      if (f.hide_empty_offers) options.hide_empty_offers = 'true'
      if (!f.hide_contracts) options.hide_contracts = 'true'

      this.tradeOffers = await this.getTradeOffers({
        options,
        type: f.type
      })
    }
  }
}
</script>

<style lang="scss">
.offer-list {
  min-width: 370px;
}
</style>
