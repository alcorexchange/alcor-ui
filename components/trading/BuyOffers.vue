<template lang="pug">
#buy-offers-component
  bread-crumbs
  .d-flex.justify-content-between.align-items-center.mt-3
    .fs-24 Buy Offers
    .d-flex.gap-8
      alcor-button(outline @click="goToHistory")
        i.el-icon-time
        span Buy Offer History

  .d-flex.align-items-center.gap-24.mt-3
    buy-offer-filters(:filters.sync="filters" :sorting.sync="sorting")
    alcor-tabs(:links="true" :tabs="tabs")
  .d-flex.gap-16.justify-content-between(v-if="buyOffers.length")
    .d-flex.flex-column.gap-8.offer-list.mt-3
      .d-flex.gap-4.fs-10.justify-content-between
        el-checkbox(
          @change="selectAll"
          v-model="isSelectedAll"
        ) Select All Items
        alcor-button(v-if="selected.length" compact outline @click="cancelOffers")
          i.el-icon-delete
          span Cancel Items

      .d-flex.flex-column.gap-8.mt-3.list
        buy-offer-list-item(
          v-for="offer in buyOffers"
          :offer="offer"
          @click="preview(offer.buyoffer_id)"
          :class="{ active: previewOffer && offer.buyoffer_id === previewOffer.buyoffer_id }"
        )
    .d-flex.flex-column.gap-16
      buy-offer-preview(v-if="previewOffer" :offer="previewOffer")
      table-log(v-if="previewOffer && offerLog" :offerLog="offerLog")

</template>

<script>
import { mapActions } from 'vuex'
import BreadCrumbs from '~/components/elements/BreadCrumbs.vue'
import AlcorButton from '~/components/AlcorButton'
import AlcorTabs from '~/components/AlcorTabs'
import BuyOfferFilters from '~/components/BuyOfferFilters'
import BuyOfferListItem from '~/components/buy-offer/BuyOfferListItem.vue'
import BuyOfferPreview from '~/components/trading/BuyOfferPreview'
import TableLog from '~/components/trading/TableLog'

export default {
  components: {
    BreadCrumbs,
    AlcorButton,
    BuyOfferFilters,
    AlcorTabs,
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
      show_invalid_offers: '0',
      min_price: '3',
      max_price: null
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
        this.filters.max_price,
        this.filters.min_price,
        this.filters.show_invalid_offers,
        this.filters.show_only_friends_offers
      ]
      return Date.now()
    },
    tabs() {
      return [
        {
          label: `Received (${this.recipientTradesCount})`,
          route: {
            path: '/trading/buy-offers',
            hash: `received${
              this.previewOffer ? '-' + this.previewOffer.buyoffer_id : ''
            }`
          }
        },
        {
          label: `Sent (${this.senderTradesCount})`,
          route: {
            path: '/trading/buy-offers',
            hash: `sent${
              this.previewOffer ? '-' + this.previewOffer.buyoffer_id : ''
            }`
          }
        }
      ]
    }
  },
  watch: {
    selected(selected) {
      this.isSelectedAll = selected.length === this.buyOffers.length
    },
    refetchProps() {
      this.$cookies.set('global_buyoffers_filters', this.filters)
      this.$cookies.set('global_buyoffers_sort_order', this.sorting.val)
      this.fetchTradeOffersCount()
      this.getOffers()
    },
    '$route.hash'(v, old) {
      this.fetchOfferLog()
      this.fetchTradeOffersCount()
      if (v.split('-')[0] !== old.split('-')[0]) this.getOffers()
      if (v.split('-')[0] !== old.split('-')[0]) this.clearSelected()
    }
  },
  mounted() {
    !this.$route.hash && this.$router.push({ hash: 'sent' })
    this.filters = this.$cookies.get('global_buyoffers_filters') || this.filters
    this.sorting.val = this.$cookies.get('global_buyoffers_sort_order')
    this.getOffers()
    this.fetchTradeOffersCount()
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
      this.$router.push({ hash: 'sent' + '-' + id })
    },
    goToHistory() {
      this.$router.push({
        name: `trading-history___${this.$i18n.locale}`,
        hash: '#buyoffers'
      })
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
          side: this.$route.hash.split('-')[0] === '#sent' ? 'buyer' : 'seller',
          sort: this.sorting.val?.split('_')[0],
          order: this.sorting.val?.split('_')[1],
          ...this.filters
        })
      ).map((offer) => ({ ...offer, isSelected: false }))
    },
    async fetchTradeOffersCount() {
      const rc = await this.getBuyOffersCountBySide({
        side: 'seller',
        sort: this.sorting.val?.split('_')[0],
        order: this.sorting.val?.split('_')[1],
        ...this.filters
      })
      if (rc) this.recipientTradesCount = rc || 0
      const sc = await this.getBuyOffersCountBySide({
        side: 'buyer',
        sort: this.sorting.val?.split('_')[0],
        order: this.sorting.val?.split('_')[1],
        ...this.filters
      })
      if (sc) this.senderTradesCount = sc || 0
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
