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
  nuxt-child

</template>

<script>
import { mapActions } from 'vuex'
import BreadCrumbs from '~/components/elements/BreadCrumbs.vue'
import AlcorButton from '~/components/AlcorButton'
import AlcorTabs from '~/components/AlcorTabs'
import TradeOfferFilters from '~/components/TradeOfferFilters'

export default {
  components: { BreadCrumbs, AlcorButton, TradeOfferFilters, AlcorTabs },
  data: () => ({
    recipientTradesCount: 0,
    senderTradesCount: 0,
    sorting: 'asc',
    filters: {
      hide_empty_offers: false,
      show_only_friends_offers: false,
      hide_contracts: false
    }
  }),
  computed: {
    refetchProps() {
      ;[
        this.sorting,
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
            path: '/trading/trade-offers/received',
            query: this.filters || null
          }
        },
        {
          label: `Sent (${this.senderTradesCount})`,
          route: {
            path: '/trading/trade-offers/sent',
            query: this.filters || null
          }
        }
      ]
    }
  },
  watch: {
    refetchProps() {
      this.$router.push({ query: this.filters })
      this.fetchTradeOffersCount()
    },
    '$store.state.user'(v) {
      v && this.fetchTradeOffersCount()
    }
  },
  mounted() {
    this.fetchTradeOffersCount()
  },
  methods: {
    ...mapActions('modal', ['newTrade']),
    ...mapActions('api', ['getTradeOffersCount']),
    openNewTradeModal() {
      this.newTrade({ transferAssets: [this.data] })
    },
    async fetchTradeOffersCount() {
      const rc = await this.getTradeOffersCount({
        filters: {
          ...this.$route.query,
          hide_contracts:
            this.$route.query.hide_contracts === 'false' ? 'true' : 'false'
        },
        type: 'recipient'
      })
      const sc = await this.getTradeOffersCount({
        filters: {
          ...this.$route.query,
          hide_contracts:
            this.$route.query.hide_contracts === 'false' ? 'true' : 'false'
        },
        type: 'sender'
      })
      if (rc) this.recipientTradesCount = rc
      if (sc) this.senderTradesCount = sc
    }
  }
}
</script>
