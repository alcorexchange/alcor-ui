<template lang="pug">
#trade-offers-component
  bread-crumbs
  .d-flex.justify-content-between.align-items-center.mt-3
    .fs-24 Trade Offers
    .d-flex.gap-8
      alcor-button(outline)
        i.el-icon-time
        span Trade Offer History
      alcor-button(access @click="openNewTradeModal")
        i.el-icon-plus
        span New Trade Offer
  .d-flex.align-items-center.gap-24.mt-3
    trade-offer-filters(:filters.sync="filters" :sorting.sync="sorting")
    alcor-tabs(:links="true" :tabs="tabs")
  .d-flex.gap-16(v-if="tradeOffers.length")
    .d-flex.flex-column.gap-8.offer-list.mt-3
      .d-flex.gap-4.fs-10
        el-checkbox(
          @change="selectAll"
          v-model="isSelectedAll"
        ) Select All Items

      .d-flex.flex-column.gap-8.mt-3
        trade-offer-list-item(v-for="offer in tradeOffers" :offer="offer")

</template>

<script>
import { mapActions } from 'vuex'
import BreadCrumbs from '~/components/elements/BreadCrumbs.vue'
import AlcorButton from '~/components/AlcorButton'
import AlcorTabs from '~/components/AlcorTabs'
import TradeOfferFilters from '~/components/TradeOfferFilters'
import TradeOfferListItem from '~/components/trade-offer/TradeOfferListItem.vue'

export default {
  components: {
    BreadCrumbs,
    AlcorButton,
    TradeOfferFilters,
    AlcorTabs,
    TradeOfferListItem
  },
  data: () => ({
    isSelectedAll: false,
    tradeOffers: [],
    recipientTradesCount: 0,
    senderTradesCount: 0,
    sorting: { val: 'asc' },
    filters: {
      hide_empty_offers: false,
      show_only_friends_offers: false,
      hide_contracts: false
    }
  }),
  computed: {
    selected() {
      return this.tradeOffers
        .filter(({ isSelected }) => isSelected)
        .map(({ offer_id }) => offer_id)
    },
    refetchProps() {
      ;[
        this.sorting.val,
        this.filters.hide_empty_offers,
        this.filters.hide_contracts,
        this.filters.show_only_friends_offers
      ]
      return Date.now()
    },
    tabs() {
      return [
        {
          label: `Received (${this.recipientTradesCount})`,
          route: {
            path: '/trading/trade-offers',
            hash: 'received'
          }
        },
        {
          label: `Sent (${this.senderTradesCount})`,
          route: {
            path: '/trading/trade-offers',
            hash: 'sent'
          }
        }
      ]
    }
  },
  watch: {
    selected(selected) {
      this.isSelectedAll = selected.length === this.tradeOffers.length
    },
    refetchProps() {
      this.$cookies.set('global_tradeoffers_filters', this.filters)
      this.$cookies.set('global_tradeoffers_sort_order', this.sorting.val)
      this.fetchTradeOffersCount()
      this.getOffers()
    },
    '$route.hash'(v) {
      this.getOffers()
      this.fetchTradeOffersCount()
      this.clearSelected()
    }
  },
  mounted() {
    !this.$route.hash && this.$router.push({ hash: 'sent' })
    this.filters = this.$cookies.get('global_tradeoffers_filters')
    this.sorting.val = this.$cookies.get('global_tradeoffers_sort_order')
    this.getOffers()
    this.fetchTradeOffersCount()
  },
  methods: {
    ...mapActions('modal', ['newTrade']),
    ...mapActions('api', ['getTradeOffersCount', 'getTradeOffers']),
    openNewTradeModal() {
      this.newTrade({ transferAssets: [this.data] })
    },
    selectAll(isSelect) {
      isSelect
        ? this.tradeOffers.forEach(o => o.isSelected = true)
        : this.clearSelected()
    },
    clearSelected() {
      this.tradeOffers.forEach(o => o.isSelected = false)
    },
    async getOffers() {
      this.tradeOffers = (
        await this.getTradeOffers({
          filters: {
            ...this.filters,
            order: this.sorting.val,
            hide_contracts: !this.filters.hide_contracts
          },
          type: this.$route.hash === '#sent' ? 'sender' : 'recipient'
        })
      ).map((offer) => ({ ...offer, isSelected: false }))
    },
    async fetchTradeOffersCount() {
      const rc = await this.getTradeOffersCount({
        filters: {
          ...this.filters,
          hide_contracts: !this.filters.hide_contracts
        },
        type: 'recipient'
      })
      const sc = await this.getTradeOffersCount({
        filters: {
          ...this.filters,
          hide_contracts: !this.filters.hide_contracts
        },
        type: 'sender'
      })
      if (rc) this.recipientTradesCount = rc
      if (sc) this.senderTradesCount = sc
    }
  }
}
</script>

<style lang="scss">

.offer-list {
  width: 420px;
}
</style>
