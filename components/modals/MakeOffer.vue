<template lang="pug">
.make-offer-component
  .title.fs-18.fw-bold.d-flex.align-items-center.gap-10.mb-3
    i.el-icon-price-tag
    span Make Buy Offer
  .d-flex.gap-32
    .d-flex.flex-column.gap-32
      assets-field(:assets="offerAssets" @removeAsset="toggleSelected")
      .d-flex.flex-column
        el-input.dark(v-model='waxAmount', size='small', placeholder='Amount of WAX')
          template(slot="append") WAX
        .disable.fs-12.mt-1(v-if="!isValidAmount") You need to offer at least 3 WAX to send a buyoffer
      el-input.dark(v-model='memo', size='small', placeholder='Memo')
      .d-flex.flex-column.gap-16(v-if="offerAssets.length === 1")
        .fs-18.disable Historical Price Data (Template based)
        .d-flex.gap-32
          span Lowest Market Listing:
          .lowest-price(v-if="lowestPrice")
            span.color-wax {{ lowestPrice }}
            span.color-green  (${{ $systemToUSD(lowestPrice) }})
        .chart
          chart(:charts='chartData', v-if='chartData.length', tab="Price", period="24H")
      .d-flex.flex-column.gap-16
        .fs-18.disable Fee Summary
        .d-flex.justify-content-between.w-50
          .fs-bold Collection Fee:
          span {{ collection_fee * 100 }}%
        .d-flex.justify-content-between.w-50
          .fw-bold Alcor Fee
          span 1%
        .d-flex.justify-content-between.w-50
          .fw-bold Tokenomics Fee
          span 2%

      .d-flex.gap-32
        alcor-button(@click="openListingModal") Buy Listing
        alcor-button.w-50(access, :disabled="!isOfferReady || !isValidAmount" @click="sendOffer()") Send Buy Offer

    .d-flex.flex-column.gap-16
      span.fs-18.disable Summary
      .d-flex.gap-32.flex-column
        el-input(
          size='small',
          v-model='search',
          prefix-icon='el-icon-search'
          :placeholder='$t("Search NFTs")',
          clearable
        )
        el-select(v-model='selectedCollection')
          el-option(
            v-for='option in availableCollections',
            :key='option.collection_name',
            :label='option.collection_name',
            :value='option.collection_name'
          )
            .d-flex.gap-10.align-items-center
              img.icon(:src="`https://resizer.atomichub.io/images/v1/preview?ipfs=${option.img}&size=370`")
              span {{ option.collection_name }} ({{ option.assets }})
        .d-flex.gap-10
          el-input.dark(
            size='small',
            v-model='minMint',
            :placeholder='$t("Min Mint")',
          )
          el-input.dark(
            size='small',
            v-model='maxMint',
            :placeholder='$t("Max Mint")',
          )

        .d-flex.gap-16.justify-content-center
          el-checkbox(
            v-model="isDuplicates"
          ) {{ $t('Only Duplicates') }}
          el-checkbox(
            v-model="isBacked"
          ) {{ $t('Only backed NFTs') }}

        .assets-list
          .available-assets
            vue-skeleton-loader(
              v-if="loading"
              :width='170',
              :height='233',
              animation='wave',
              wave-color='rgba(150, 150, 150, 0.1)',
              :rounded='true'
            )
            normal-card.pointer(
              v-else
              v-for="item in availableAssets"
              :key="item.asset_id"
              :data="item"
              @click="offerAssets.length > 0 && item.collection.collection_name !== offerAssets[0].collection.collection_name ? null : toggleSelected(item)"
              :class="{ 'active-border': offerAssets.find(({ asset_id }) => asset_id === item.asset_id), disable: offerAssets.length > 0 && item.collection.collection_name !== offerAssets[0].collection.collection_name }"
              mode="preview"
              :small="true"
            )
          .gradient

</template>

<script>
import { mapState, mapActions } from 'vuex'
import VueSkeletonLoader from 'skeleton-loader-vue'
import Chart from '~/components/nft_markets/Chart'
import AssetsField from '~/components/nft_markets/AssetsField'
import NormalCard from '~/components/nft_markets/NormalCard'
import AlcorButton from '~/components/AlcorButton'

export default {
  components: { AssetsField, NormalCard, VueSkeletonLoader, Chart, AlcorButton },
  data: () => ({
    loading: false,
    selectedCollection: null,
    isDuplicates: false,
    isBacked: false,
    minMint: null,
    maxMint: null,
    search: '',
    availableAssets: [],
    availableCollections: [],
    offerAssets: [],
    chartData: [],
    lowestPrice: null,
    waxAmount: null,
    memo: '',
    collection_fee: null
  }),
  computed: {
    ...mapState('modal', ['context']),
    refetchProps() { [this.selectedCollection, this.isDuplicates, this.isBacked, this.minMint, this.maxMint, this.search]; return Date.now() },
    isOfferReady() { return this.waxAmount && this.offerAssets.length },
    isValidAmount() { return this.waxAmount >= 3 }
  },
  watch: {
    context() {
      this.offerAssets = []
      this.setOptions()
      this.selectAsset()
      this.getAccountCollection()
    },
    refetchProps() {
      this.fetchAssets()
    },
    offerAssets() {
      this.getChart()
      this.getLowestPrice()
      this.getMarketFee()
    }
  },
  mounted() {
    this.setOptions()
    this.selectAsset()
    this.getAccountCollection()
  },
  methods: {
    ...mapActions('api', ['getAssets', 'getAccountSpecificStats', 'getChartData', 'getTemplatePrice']),
    ...mapActions('chain', ['sendBuyOffer']),
    ...mapActions('modal', ['buy']),
    openListingModal() {
      this.buy()
    },
    setOptions() {
      this.selectedCollection = this.context.collection_name || this.context.assets[0].collection.collection_name
    },
    selectAsset() {
      this.toggleSelected(this.context.assets[0])
    },
    toggleSelected(asset) {
      this.offerAssets.find(({ asset_id }) => asset_id === asset.asset_id)
        ? this.offerAssets = this.offerAssets.filter(({ asset_id }) => asset_id !== asset.asset_id)
        : this.offerAssets.push(asset)
    },
    sendOffer() {
      this.sendBuyOffer({
        buyOfferPrice: (+this.waxAmount).toFixed(8) + ' WAX',
        assetsIDs: this.offerAssets.map(({ asset_id }) => asset_id),
        memo: this.memo,
        seller: this.context.seller
      })
    },
    getMarketFee() {
      if (!this.offerAssets.length) return
      this.collection_fee = this.offerAssets[0].collection.market_fee
    },
    async getLowestPrice() {
      if (this.offerAssets.length !== 1) return
      const r = await this.getTemplatePrice({ templateID: this.offerAssets[0].template.template_id })
      this.lowestPrice = +r[0].min / Math.pow(10, r[0].token_precision)
    },
    async getChart() {
      if (this.offerAssets.length !== 1) return
      const data = await this.getChartData({
        template_id: this.offerAssets[0].template.template_id,
        schema_name: this.offerAssets[0].schema.schema_name,
        burned: this.offerAssets[0].is_burnable
      })
      this.chartData = data
    },
    fetchAssets() {
      clearTimeout(this.debounce)
      this.debounce = setTimeout(async () => {
        this.loading = true
        const assets = await this.getAssets({
          owner: this.context.seller,
          collection_name: this.selectedCollection,
          search: this.search,
          max_template_mint: this.maxMint,
          min_template_mint: this.minMint,
          has_backed_tokens: !!this.isBacked,
          only_duplicate_templates: !!this.isDuplicates
        })

        this.availableAssets = assets.reduce((res, asset) => {
          this.offerAssets.find(({ asset_id: offerID }) => offerID === asset.asset_id) ? res[0].push(asset) : res[1].push(asset)
          return res
        }, [[], []]).flat()

        this.loading = false
      }, 600)
    },
    async getAccountCollection() {
      const { collections } = await this.getAccountSpecificStats({ account: this.context.seller })
      this.availableCollections = collections.map(({ assets, collection }) => ({ ...collection, assets }))
    }
  }
}
</script>

<style lang="scss">
.available-assets .disable {
  cursor: not-allowed;
  filter: brightness(50%)
}

.make-offer-component .chart {
  height: 150px;
}

.make-offer-component .lowest-price {
  font-size: 14px;
}

.make-offer-component .el-input--small,
.make-offer-component .el-select {
  .el-input__inner {
    background-color: var(--bg-alter-2);
  }

  &.dark .el-input__inner {
    background-color: var(--btn-active);
    border: 1px solid var(--btn-active);
  }
}

.make-offer-component .assets-list {
  position: relative;

  .gradient {
    background: linear-gradient(180deg, rgba(33, 33, 33, 0) 0%, var(--dialog-background) 77.95%);
    position: absolute;
    width: 100%;
    height: 100px;
    bottom: 0;
  }

}

.make-offer-component .available-assets {
  padding: 20px 20px 80px 20px;
  height: 750px;
  width: 650px;
  gap: 32px;
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  overflow: scroll;

  -ms-overflow-style: none;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
}
</style>
