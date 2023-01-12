<template lang="pug">
#buy-offers-component
  history-buy-offer-filters.mt-2(:filters.sync="filters" :sorting.sync="sorting")
  .d-flex.gap-16.justify-content-between(v-if="buyOffers.length")
    .d-flex.flex-column.gap-8.offer-list.mt-3
      .d-flex.flex-column.gap-8.mt-3.list
        buy-offer-list-item(
          :previewMode="true"
          v-for="offer in buyOffers"
          :key="offer"
          :offer="offer"
          @click="preview(offer.buyoffer_id)"
          :class="{ active: previewOffer && offer.buyoffer_id === previewOffer.buyoffer_id }"
        )
    .d-flex.flex-column.gap-16
      buy-offer-preview(v-if="previewOffer" :offer="previewOffer" :previewMode="true")
      table-log(v-if="previewOffer && offerLog" :offerLog="offerLog")

</template>

<script>
import { mapActions } from 'vuex'
import BreadCrumbs from '~/components/elements/BreadCrumbs.vue'
import AlcorButton from '~/components/AlcorButton'
import HistoryBuyOfferFilters from '~/components/HistoryBuyOfferFilters'
import BuyOfferListItem from '~/components/buy-offer/BuyOfferListItem.vue'
import BuyOfferPreview from '~/components/trading/BuyOfferPreview'
import TableLog from '~/components/trading/TableLog'

export default {
  components: {
    BreadCrumbs,
    AlcorButton,
    HistoryBuyOfferFilters,
    BuyOfferListItem,
    BuyOfferPreview,
    TableLog
  },
  data: () => ({
    isSelectedAll: false,
    buyOffers: [],
    offerLog: null,
    recipientTradesCount: 0,
    senderTradesCount: 0,
    sorting: { val: 'created_asc' },
    filters: {
      show_only_friends_offers: false,
      type: 'account',
      status: '1,2,3',
      after: null,
      before: null,
      min_price: '3',
      max_price: ''
    }
  }),
  computed: {
    previewOffer() {
      const previewId = this.$route.hash.split('-')[1]
      return (
        previewId &&
        this.buyOffers.find(({ buyoffer_id }) => buyoffer_id === previewId)
      )
    },
    selected() {
      return this.buyOffers
        .filter(({ isSelected }) => isSelected)
        .map(({ buyoffer_id, price: { amount } }) => [buyoffer_id, amount])
    },
    refetchProps() {
      ;[
        this.sorting.val,
        this.filters.after,
        this.filters.before,
        this.filters.type,
        this.filters.status,
        this.filters.max_price,
        this.filters.min_price,
        this.filters.show_only_friends_offers
      ]
      return Date.now()
    }
  },
  watch: {
    selected(selected) {
      this.isSelectedAll = selected.length === this.buyOffers.length
    },
    refetchProps() {
      this.$cookies.set('global_history_buy_offers_filters', this.filters)
      this.$cookies.set('global_history_buy_offers_sotring', this.sorting.val)
      this.getOffers()
    },
    '$route.hash'(v, old) {
      this.fetchOfferLog()
      if (v.split('-')[0] !== old.split('-')[0]) this.getOffers()
      if (v.split('-')[0] !== old.split('-')[0]) this.clearSelected()
    }
  },
  mounted() {
    !this.$route.hash && this.$router.push({ hash: 'sent' })
    this.filters =
      this.$cookies.get('global_history_buy_offers_filters') || this.filters
    this.sorting.val = this.$cookies.get('global_history_buy_offers_sotring')
    this.getOffers()
  },
  methods: {
    ...mapActions('modal', ['newTrade']),
    ...mapActions('api', [
      'getBuyOffersCountBySide',
      'getBuyOffersBySide',
      'getBuyOfferLog'
    ]),
    async cancelOffers() {
      await this.$store.dispatch('chain/cancelBuyOffers', this.selected)
    },
    preview(id) {
      this.$router.push({ hash: 'buyoffers' + '-' + id })
    },
    openNewTradeModal() {
      this.newTrade({ transferAssets: [this.data] })
    },
    selectAll(isSelect) {
      isSelect
        ? this.buyOffers.forEach((o) => (o.isSelected = true))
        : this.clearSelected()
    },
    clearSelected() {
      this.buyOffers.forEach((o) => (o.isSelected = false))
    },
    async fetchOfferLog() {
      const offerId = this.$route.hash.split('-')[1]

      if (offerId) {
        this.offerLog = await this.getBuyOfferLog({
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
      this.buyOffers = (
        await this.getBuyOffersBySide({
          side: this.filters.type,
          sort: this.sorting.val?.split('_')[0] || 'created',
          order: this.sorting.val?.split('_')[1] || 'asc',
          ...this.filters,
          before: new Date(this.filters.before).getTime(),
          after: new Date(this.filters.after).getTime()
        })
      ).map((offer) => ({ ...offer, isSelected: false }))
    }
  }
}
</script>

<style lang="scss">
.offer-list {
  min-width: 370px;
}
.list {
  max-height: 600px;
  overflow: scroll;

  -ms-overflow-style: none;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
}
</style>
