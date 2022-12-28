<template lang="pug">
#trade-offers-component
  bread-crumbs
  .d-flex.justify-content-between.align-items-center.mt-3
    .fs-24 Trade Offers
    .d-flex.gap-8
      alcor-button(outline @click="goToHistory")
        i.el-icon-time
        span Trade Offer History
      alcor-button(access @click="goToTrade")
        i.el-icon-plus
        span New Trade Offer
  .d-flex.align-items-center.gap-24.mt-3
    trade-offer-filters(:filters.sync="filters" :sorting.sync="sorting")
    alcor-tabs(:links="true" :tabs="tabs")
  .d-flex.gap-16.justify-content-between(v-if="tradeOffers.length")
    .d-flex.flex-column.gap-8.offer-list.mt-3
      .d-flex.gap-4.fs-10.justify-content-between
        el-checkbox(
          @change="selectAll"
          v-model="isSelectedAll"
        ) Select All Items
        alcor-button(v-if="selected.length" compact outline @click="cancelOffers")
          i.el-icon-delete
          span Cancel Items

      .d-flex.flex-column.gap-8.mt-3
        trade-offer-list-item(
          v-for="offer in tradeOffers"
          :offer="offer"
          @click="preview(offer.offer_id)"
          :class="{ active: previewOffer && offer.offer_id === previewOffer.offer_id }"
        )
    .d-flex.flex-column.gap-16
      offer-preview(v-if="previewOffer" :offer="previewOffer")
      table-log(v-if="previewOffer && offerLog" :offerLog="offerLog")

</template>

<script>
import { mapActions } from 'vuex'
import BreadCrumbs from '~/components/elements/BreadCrumbs.vue'
import AlcorButton from '~/components/AlcorButton'
import AlcorTabs from '~/components/AlcorTabs'
import TradeOfferFilters from '~/components/TradeOfferFilters'
import TradeOfferListItem from '~/components/trade-offer/TradeOfferListItem.vue'
import OfferPreview from '~/components/trading/OfferPreview'
import TableLog from '~/components/trading/TableLog'

export default {
  components: {
    BreadCrumbs,
    AlcorButton,
    TradeOfferFilters,
    AlcorTabs,
    TradeOfferListItem,
    OfferPreview,
    TableLog
  },
  data: () => ({
    isSelectedAll: false,
    tradeOffers: [],
    offerLog: null,
    recipientTradesCount: 0,
    senderTradesCount: 0,
    sorting: { val: 'asc' },
    filters: {
      state: '0,1',
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
    selected() {
      return this.tradeOffers
        .filter(({ isSelected }) => isSelected)
        .map(({ offer_id }) => offer_id)
    },
    refetchProps() {
      ;[
        this.sorting.val,
        this.filters.hide_empty_offers,
        this.filters.state,
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
            hash: `sent${
              this.previewOffer ? '-' + this.previewOffer.offer_id : ''
            }`
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
    '$route.hash'(v, old) {
      this.fetchOfferLog()
      this.fetchTradeOffersCount()
      if (v.split('-')[0] !== old.split('-')[0]) this.getOffers()
      if (v.split('-')[0] !== old.split('-')[0]) this.clearSelected()
    }
  },
  mounted() {
    !this.$route.hash && this.$router.push({ hash: 'sent' })
    this.filters =
      this.$cookies.get('global_tradeoffers_filters') || this.filters
    this.sorting.val = this.$cookies.get('global_tradeoffers_sort_order')
    this.getOffers()
    this.fetchTradeOffersCount()
  },
  methods: {
    ...mapActions('modal', ['newTrade']),
    ...mapActions('api', [
      'getTradeOffersCount',
      'getTradeOffers',
      'getOfferLog'
    ]),
    async cancelOffers() {
      await this.$store.dispatch('chain/cancelOffers', this.selected)
    },
    preview(id) {
      this.$router.push({ hash: 'sent' + '-' + id })
    },
    openNewTradeModal() {
      this.newTrade({ transferAssets: [this.data] })
    },
    goToTrade() {
      this.$router.push({
        name: `wallet-nfts-trading-id___${this.$i18n.locale}`
      })
    },
    goToHistory() {
      this.$router.push({
        name: `trading-history___${this.$i18n.locale}`,
        hash: '#tradeoffers'
      })
    },
    selectAll(isSelect) {
      isSelect
        ? this.tradeOffers.forEach((o) => (o.isSelected = true))
        : this.clearSelected()
    },
    clearSelected() {
      this.tradeOffers.forEach((o) => (o.isSelected = false))
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

      if (f.show_indalid_offer) options.show_indalid_offer = 'true'
      if (f.show_only_friends_offers) {
        options.show_only_friends_offers = 'true'
        options.recipient = 'none'
      }
      if (f.hide_empty_offers) options.hide_empty_offers = 'true'
      if (!f.hide_contracts) options.hide_contracts = 'true'

      this.tradeOffers = (
        await this.getTradeOffers({
          options,
          type:
            this.$route.hash.split('-')[0] === '#sent' ? 'sender' : 'recipient'
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
  min-width: 370px;
}
</style>
