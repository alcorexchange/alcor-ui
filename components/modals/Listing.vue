<template lang="pug">
.listing-component
  .title.fs-18.fw-bold.d-flex.align-items-center.gap-10.mb-3
    i.el-icon-news
    span {{ context.mode ? 'Manage' : 'Create' }} Listing
  market-tabs.mb-3(v-if="!context.mode" :tabs="tabs" v-model="tab" @change="handleTab")
  .d-flex.gap-32
    .d-flex.flex-column.gap-32
      normal-card(:data="context.asset_id ? context : context.assets[0]" mode="preview")
    .d-flex.flex-column.gap-32.w-100

      .sale-form.d-flex.flex-column.gap-16(v-if="tab == 'sales'")
        span.fs-18.disable Summary
        el-input.dark.w-450(type='number' v-model='waxAmount', size='small', placeholder='Amount of WAX')
          template(slot="append") WAX

      .sale-form.d-flex.flex-column.gap-16(v-else-if="tab == 'auctions'")
        span.fs-18.disable Starting Price
        el-input.dark(type='number' v-model='waxAmount', size='small', placeholder='Amount of WAX')
          template(slot="append") WAX
        span.fs-18.disable Duration
        .w-450.d-flex.gap-8
          el-input.dark.w-33(type='number' v-model='days', size='small', placeholder='0')
            template(slot="append") Days
          el-input.dark.w-33(type='number' v-model='hours', size='small', placeholder='0')
            template(slot="append") Hours
          el-input.dark.w-33(type='number' v-model='minutes', size='small', placeholder='0')
            template(slot="append") Minutes

      .general-info.d-flex.flex-column.gap-16
        .d-flex.flex-column.gap-8
          .fs-18.disable Historical Price Data (Template based)
          .d-flex.gap-32
            span Lowest Market Listing:
            .lowest-price(v-if="lowestPrice")
              span.color-wax {{ lowestPrice }}
              span.color-green  (${{ $systemToUSD(lowestPrice) }})
          .chart
            chart(:charts='chartData', v-if='chartData.length', tab="Price", period="24H")

        .d-flex.flex-column.gap-8
          .fs-18.disable Fee Summary
          .d-flex.justify-content-between.w-50
            .fs-bold Collection Fee:
            span {{ context.collection.market_fee * 100 }}%
          .d-flex.justify-content-between.w-50
            .fw-bold Alcor Fee
            span 1%
          .d-flex.justify-content-between.w-50
            .fw-bold Tokenomics Fee
            span 2%
      .d-flex.gap-8.w-100
        alcor-button.w-50(v-if="context.mode" @click="cancelListing") Cancel
        alcor-button(:class="{ 'w-50': context.mode, 'w-100': !context.mode }" access :disabled="isDisabled" @click="listing")
          | Confirm {{ tab === 'sales' ? 'Listing' : 'Auction' }}

</template>

<script>
import { mapState, mapActions } from 'vuex'
import NormalCard from '~/components/nft_markets/NormalCard'
import AlcorButton from '~/components/AlcorButton'
import MarketTabs from '~/components/nft_markets/MarketTabs'
import Chart from '~/components/nft_markets/Chart'

export default {
  components: { NormalCard, AlcorButton, MarketTabs, Chart },
  data: () => ({
    lowestPrice: null,
    waxAmount: null,
    days: 0,
    hours: 0,
    minutes: 0,
    chartData: [],
    auctionDuration: null,
    tab: 'sales',
    tabs: { sales: 'Sales', auctions: 'Auctions' }
  }),
  computed: {
    ...mapState('modal', ['context']),
    isDisabled() {
      return this.tab === 'sales'
        ? +this.waxAmount <= 0
        : +this.waxAmount <= 0 || +this.days + +this.hours + +this.minutes <= 0
    }
  },
  watch: {
    context() {
      this.getLowestPrice()
      this.getChart()
      this.context.mode ? this.tab = this.context.mode : null
      this.waxAmount = null
      this.context.listing_price ? this.waxAmount = this.context.listing_price / Math.pow(10, this.context.price.token_precision) : null
    }
  },
  mounted() {
    this.getLowestPrice()
    this.getChart()
    this.context.listing_price ? this.waxAmount = this.context.listing_price / Math.pow(10, this.context.price.token_precision) : null
    this.context.mode ? this.tab = this.context.mode : null
  },
  methods: {
    ...mapActions('api', ['getChartData', 'getTemplatePrice']),
    ...mapActions('chain', ['list', 'cancelList', 'auction', 'cancelAuction']),
    handleTab(value) {
      this.tab = value
    },
    listing() {
      if (this.tab === 'auctions') {
        this.auctionDuration = this.days * 24 * 3600 + this.hours * 3600 + this.minutes * 60
      }

      this.tab == 'sales'
        ? this.list({
          asset_ids: [this.context.asset_id],
          listing_price: (+this.waxAmount).toFixed(8) + ' WAX',
          currentListing: this.context.sales[0]?.sale_id
        }).then(() => this.$router.go(0))
        : this.auction({
          asset_ids: [this.context.asset_id],
          starting_bid: (+this.waxAmount).toFixed(8) + ' WAX',
          duration: this.auctionDuration,
        })
    },
    cancelListing() {
      this.tab == 'sales'
        ? this.cancelList(
          { currentListing: +this.context.sale_id }
        ).then(() => this.$router.go(0))
        : this.cancelAuction(
          { currentListing: +this.context.auction_id }
        ).then(() => this.$router.go(0))
    },
    async getChart() {
      this.chartData = []
      const template_id = this.context.template?.template_id || this.context.assets[0].template.template_id
      const schema_name = this.context.schema?.schema_name || this.context.assets[0].schema.schema_name
      const burned = this.context.is_burnable || this.context.assets[0].is_burnable
      const data = await this.getChartData({
        template_id,
        schema_name,
        burned
      })
      if (data.length) this.chartData = data
    },
    async getLowestPrice() {
      const templateID = this.context.template?.template_id || this.context.assets[0].template.template_id
      const r = await this.getTemplatePrice({ templateID })
      if (r.length) this.lowestPrice = (+r[0].min / Math.pow(10, r[0].token_precision)).toFixed(2)
    }
  }
}
</script>

<style lang="scss">
.listing-component .w-450 {
  width: 450px;
}

.listing-component .el-input--small,
.listing-component .el-select {
  .el-input__inner {
    background-color: var(--bg-alter-2);
  }

  &.dark .el-input__inner {
    background-color: var(--btn-active);
    border: 1px solid var(--btn-active);
  }
}
</style>
