<template lang="pug">
#trade-offers-page.py-3.py-lg-5
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
  .d-flex.flex-column
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
    tradeOffers: null,
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
    refetchProps() {
      this.$cookies.set('global_tradeoffers_filters', this.filters)
      this.$cookies.set('global_tradeoffers_sort_order', this.sorting.val)
      this.fetchTradeOffersCount()
      this.getOffers()
    },
    '$store.state.user'(v) {
      if (v) {
        this.fetchTradeOffersCount()
        this.getOffers()
      }
    },
    '$route.hash'(v) {
      this.getOffers()
      this.fetchTradeOffersCount()
    }
  },
  mounted() {
    !this.$route.hash && this.$router.push({ hash: 'sent' })
    this.filters = this.$cookies.get('global_tradeoffers_filters')
    this.sorting.val = this.$cookies.get('global_tradeoffers_sort_order')
    if (this.$store.state.user?.name) {
      this.getOffers()
      this.fetchTradeOffersCount()
    }
  },
  methods: {
    ...mapActions('modal', ['newTrade']),
    ...mapActions('api', ['getTradeOffersCount', 'getTradeOffers']),
    openNewTradeModal() {
      this.newTrade({ transferAssets: [this.data] })
    },
    async getOffers() {
      console.log('getttttt')
      this.tradeOffers = await this.getTradeOffers({
        filters: {
          ...this.filters,
          order: this.sorting.val,
          hide_contracts: !this.filters.hide_contracts
        },
        type: this.$route.hash === '#sent' ? 'sender' : 'recipient'
      })
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
