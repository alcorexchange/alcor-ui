<template lang='pug'>
  .j-container.nftburnable
    nuxt-link(:to='"/wallet-inventory/nfts"', :exact='true')
      a#return-btn Return
    .page-header.d-flex.justify-content-between.row
      .page-header_text Buy Offer: #1009597
    .bg-c-dark.p-2.rounded.border.border-secondary
      .d-flex.justify-content-end Created: 6/17/2022 9:46
      .row
        .col-6
          .border.border-success.p-4.rounded
            h5.text-center.pb-4 offered items: 1
            .d-flex.justify-content-center.align-items-center
              simpleCard
        .col-6.d-flex.flex-column.align-items-between.justify-content-between
          div
            h5.pb-4 Summary
            .d-flex.justify-content-between.align-items-start
              h6.text-sm Buy Offered:
              h6 500 WAX ($61.88)
            .d-flex.justify-content-between.align-items-start
              h6 Collection Fee(1%):
              h6.text-danger 5 WAX ($0.61)
            .d-flex.justify-content-between.align-items-start
              h6 Alcor Fee(1%):
              h6.text-danger 5 WAX ($0.61)
            .d-flex.justify-content-between.align-items-start.pb-2
              h6 Tokenomics Fee (1%):
              h6.text-danger WAX ($0.61)
            .d-flex.justify-content-between.align-items-center.bg-black.rounded.px-2
              span Recipient receives:
              span.text-warning 485 WAX ($60.05)
          el-button.w-100.float-end(type="danger") Cancel
    .bg-c-dark.p-4.rounded.mt-4.border.border-secondary
      .row
        .col-2
          span Event
        .col-6
          span Data
        .col-2
          span Date
        .col-2
          span Tx
      .row.bg-c-black.rounded.mt-1.p-1
        .col-2
          span.f-12 lognewbuyo
        .col-6
          span.f-12 collection_fee: 0.06 maker_marketplace:
        .col-2
          span.f-12 10/25/2021, 6:49 PM
        .col-2
          span.f-12 10/25/2021, 6:49 PM
</template>
<script>
import TransferRow from '~/components/nft_markets/TransferRow'
import SalesRow from '~/components/nft_markets/SalesRow'
import LogsRow from '~/components/nft_markets/LogsRow'
import NFTBackModal from '~/components/modals/NFTBack'
import Chart from '~/components/nft_markets/Chart'
import CustomSkeletonVue from '~/components/CustomSkeleton'
import simpleCard from '~/components/wallet/cards/simpleCard.vue'
export default {
  components: {
    TransferRow,
    SalesRow,
    NFTBackModal,
    Chart,
    LogsRow,
    CustomSkeletonVue,
    simpleCard
  },
  data() {
    return {
      loading: true,
      show_modal: false,
      assetData: '',
      attributeKeys: [],
      salesData: [],
      transferData: [],
      logsData: [],
      templatePrice: [],
      chartData: [],
      detailType: ''
    }
  },
  computed: {
    nftName() {
      if (this.assetData) {
        return this.assetData.name
      } else return ''
    },
    id() {
      if (this.assetData) {
        return this.assetData.asset_id
      } else return ''
    },
    collectionName() {
      if (this.assetData) {
        return this.assetData.collection.name
      } else return ''
    },
    schemaName() {
      if (this.assetData) {
        return this.assetData.schema.schema_name
      } else return ''
    },
    owner() {
      if (this.assetData) {
        return this.assetData.owner
      } else return ''
    },
    template_mint() {
      if (this.assetData) {
        return this.assetData.template_mint
      } else return ''
    },
    issued_supply() {
      if (this.assetData) {
        return this.assetData.template.issued_supply
      } else return ''
    },
    max_supply() {
      if (this.assetData) {
        return this.assetData.template.max_supply
      } else return ''
    },
    template_id() {
      if (this.assetData) {
        return this.assetData.template.template_id
      } else return ''
    },
    is_transferable() {
      if (this.assetData) {
        return this.assetData.template.is_transferable
      } else return ''
    },
    is_burnable() {
      if (this.assetData) {
        return this.assetData.template.is_burnable
      } else return ''
    },
    backedToken() {
      if (this.assetData.backed_tokens && this.assetData.backed_tokens.length) {
        return this.assetData.backed_tokens.map((item) => {
          return {
            token_contract: item.token_contract,
            amount: item.amount / Math.pow(10, item.token_precision),
            token_symbol: item.token_symbol
          }
        })
      } else return []
    },
    lowestSales() {
      if (this.templatePrice.length) {
        return (
          this.templatePrice[0].min /
          Math.pow(10, this.templatePrice[0].token_precision)
        ).toFixed(2)
      } else return 0
    },
    highestSales() {
      if (this.templatePrice.length) {
        return (
          this.templatePrice[0].max /
          Math.pow(10, this.templatePrice[0].token_precision)
        ).toFixed(2)
      } else return 0
    }
  },
  mounted() {
    console.log(this.$route.params)
    this.asset_id = this.$route.params.asset_id
    this.getAssetData()
  },
  methods: {
    outofmodalclick(event) {
      if (event.target.classList.contains('nft-modal-container'))
        this.show_modal = false
    },
    getAssetData() {
      this.getSpecificAsset(this.asset_id)
      this.getAssetsTransfer(this.asset_id)
      this.getAssetsSales(this.asset_id)
      this.getAssetsLog(this.asset_id)
    },
    handleCloseModal() {
      console.log('handleCloseModal')
      this.show_modal = false
    },
    async getSpecificAsset(asset_id) {
      this.loading = true
      const data = await this.$store.dispatch('api/getSpecificAsset', {
        asset_id
      })
      this.assetData = data
      await this.getTemplatePrice(data.template.template_id)
      await this.getChartData(
        data.template.template_id,
        data.schema.schema_name,
        data.is_burnable
      )
      this.attributeKeys = Object.keys(data.data)
      this.loading = false
    },
    async getAssetsTransfer(asset_id) {
      this.loading = true
      this.transferData = await this.$store.dispatch('api/getAssetsTransfer', {
        asset_id
      })
    },
    async getAssetsSales(asset_id) {
      this.loading = true
      const data = await this.$store.dispatch('api/getAssetsSales', {
        asset_id
      })
      this.salesData = data
      console.log(data)
    },
    async getAssetsLog(asset_id) {
      this.loading = true
      this.logsData = await this.$store.dispatch('api/getAssetsLog', {
        asset_id
      })
    },
    async getTemplatePrice(templateID) {
      this.loading = true
      this.templatePrice = await this.$store.dispatch('api/getTemplatePrice', {
        templateID
      })
    },
    // get price history for a template for NFT sale chart
    async getChartData(template_id, schema_name, burned) {
      this.chartData = await this.$store.dispatch('api/getChartData', {
        template_id,
        schema_name,
        burned
      })
    }
  }
}
</script>
<style scoped>
  .f-12 {
    font-size:12px;
  }
 .bg-black {
  background:#212121
 }
 .bg-c-black {
  background:#161617
 }
</style>
<style lang='scss'>
.nftburnable {
  .weight-400 {
    font-weight: 400 !important;
  }
  .chart-topline {
    background-color: #202021;
    border-radius: 5px;
    padding: 7px 12px;
  }
  .chart-items > p:last-child {
    margin: 0;
  }
  .transfer-row {
    font-size: 14px;
  }
  .el-tab-pane div > a,
  .tab-content-date {
    font-weight: 500;
  }
  .tab-content-date {
    padding-left: 27px;
    font-size: 14px;
  }
  .el-tabs__item {
    width: 100%;
  }
  .fs-18 {
    font-size: 18px;
    font-weight: 500;
  }
  .mt-65 {
    margin-top: 65px;
  }
  .price-chart,
  .chart-items {
    font-weight: 500;
  }
  .col-4.chart-price {
    font-size: 20px;
  }
  .chart-items p {
    font-size: 14px;
  }
  .color-yellow {
    color: #f89022;
  }
  .color-green {
    color: #66c167 !important;
  }
  .attr span:first-child {
    font-size: 18px;
  }
  .attr span:last-child {
    font-size: 14px;
  }
  .color-red {
    color: #ff4949;
    margin-right: 5px;
  }
  #tv_chart_container {
    width: 100%;
  }
  .border-radius5 {
    border-radius: 5px;
  }
  .bg-c-dark {
    background-color: #202021;
  }
  .pro {
    span {
      margin-left: 5px;
    }
  }
  .nftcard.create-collections.border-radius5 h4 {
    color: white;
  }
  .attribute {
    margin-bottom: 12px !important;
  }
  div.page-header_text h4,
  p {
    font-size: 24px;
    color: #999999;
  }
  .page-header_text {
    margin-bottom: 20px;
    .ml-6 {
      font-size: 24px;
      color: #999999;
    }
  }
  .other-info {
    width: 40%;
    h4 {
      font-size: 20px;
    }
  }
  .nft-transfer h5 {
    font-size: 12px;
    margin-top: 9px;
  }
  .col-2 > h5 {
    margin-left: 16px;
  }
  .el-tabs__item {
    width: 130px !important;
    text-align: center;
    border-bottom: 1px solid #333;
  }
  .button {
    width: 380px;
    height: auto;
    margin-left: 181px;
    margin-top: 20px;
  }
  .burnable-tab-pane .el-tabs__active-bar {
    background-color: green !important;
  }
  .description-info {
    width: 50%;
  }
  .col-4 {
    font-size: 12px;
  }
  .wax-exchange {
    font-weight: 500;
    font-size: 16px;
    color: #34fb24;
  }
  .token-exchange {
    font-weight: 500;
    font-size: 16px;
    line-height: 10px;
    color: #dd6f00;
  }
  .description-name,
  .wax-exchange {
    margin-bottom: 15px !important;
  }
  .description-fee,
  .description-title {
    font-size: 14px;
    color: var(--cancel);
    margin-bottom: 5px;
    span {
      margin-left: 4px;
    }
  }
  .description {
    font-size: 16px;
  }
  .burn-btn {
    float: right;
    text-align: center;
    padding: 13px 14px;
    width: 93px;
    height: 48px;
    color: #ffffff;
    font-size: 14px;
    font-weight: 500;
    background: #333333;
    border-radius: 8px;
    cursor: pointer;
    span {
      margin-left: 4px;
    }
  }
  .tokens-btn {
    float: right;
    text-align: center;
    padding: 13px 14px;
    width: 124px;
    height: 48px;
    color: #ffffff;
    font-size: 14px;
    font-weight: 500;
    background: #333333;
    border-radius: 8px;
    cursor: pointer;
    margin: 0rem 1rem;
  }
  .create-collection-btn {
    float: right;
    text-align: center;
    padding: 13px 3px;
    width: 154px;
    height: 48px;
    color: #000;
    font-size: 14px;
    font-weight: 600 !important;
    background: #67c23a;
    border-radius: 8px;
    cursor: pointer;
  }
  .nft-image-container {
    padding: 26px 48px 0px 48px;
    width: 345px;
    height: 395px;
    border-radius: 10px;
  }
  .nft-Name-container {
    padding: 9px 9px 15px 15px;
    width: 345px;
    min-height: 311px;
    border-radius: 10px;
    .text-detail {
      word-break: break-all;
    }
    .attr {
      margin-bottom: 10px;
      justify-content: space-between;
      padding-right: 0px;
      flex-wrap: wrap;
      flex-direction: revert;
      .col-4 {
        width: 33%;
      }
      .col-8 {
        font-size: 14px;
        width: 67%;
      }
      span {
        padding: 0 !important;
      }
    }
  }
  .nft-transfer {
    padding: 24px 25px 25px 25px;
    width: 595px;
    min-height: 311px;
    border-radius: 10px;
  }
  .nft-transfer {
    background-color: #202021;
    padding: 24px;
  }
  .nft-Name-container,
  .nft-info.border-radius5 {
    background-color: #202021;
    padding: 14px;
  }
  .nft {
    width: auto;
    height: auto;
  }
  .nft-image-container,
  .nft-info.border-radius5 {
    background-color: #202021;
    padding: 20px;
    margin-bottom: 68px;
  }
  .nft-info.border-radius5 {
    width: 595px;
    min-height: 395px;
  }
  .nft-image {
    width: 249px;
    height: 249px;
    object-fit: cover;
    background-repeat: no-repeat;
    margin-left: 28px;
    margin-top: 16px;
  }
  .nft1-container {
    border: 1px solid #67c23a;
    border-radius: 5px;
    padding: 5px;
    width: 79px;
    height: 79px;
    margin-left: 114px;
    margin-top: 20px;
  }
  .nft1-image {
    width: 65px;
    height: 65px;
    object-fit: cover;
    background-repeat: no-repeat;
    background-size: 100%;
  }
  .prop-image {
    width: 14px;
    height: 14px;
    object-fit: cover;
    background-repeat: no-repeat;
    margin-bottom: 10px;
  }
  .schemas-title {
    margin: 43px 0;
    font-weight: 500;
    font-size: 20px;
  }
  .history {
    padding-left: 55px;
  }
  .schemas-history {
    margin: 123px 0;
    font-weight: 500;
    font-size: 20px;
  }
  .plus-round-background {
    width: 70px;
    height: 70px;
    margin: auto;
  }
  .almemes-background {
    width: 100px;
    height: 117px;
    margin: auto;
  }
  .almemes h4 {
    margin: 30px 0 0 !important;
    color: #67c23a;
  }
  .card-content {
    margin-top: 23px;
    font-weight: 700;
    font-size: 24px;
    text-align: center;
    h4 {
      margin: 10px 0;
    }
  }
  #return-btn::before {
    content: '←';
  }
  #return-btn {
    font-weight: 500;
    font-size: 14px;
    color: #9f979a !important;
    cursor: pointer;
    padding-left: 10px;
  }
  .page-header h4 {
    margin: 0 !important;
  }
  .page-header {
    margin: 32px 0 9px 0;
  }
  .info-capacity {
    width: 257px;
  }
  .card-group {
    margin-top: 32px;
  }
  .progress {
    margin-top: 4px;
    background-color: #161617;
    .progress-bar {
      background-color: #67c23a;
      color: black;
    }
  }
  .ques-symbol {
    padding: 6px;
    margin-right: 6px;
    color: #9f979a;
    background-color: #202021;
    margin-right: 6px;
    font-weight: 700;
  }
  div.progress-bar {
    text-align: right;
    font-weight: 500;
    font-size: 14px;
    padding-right: 5px;
  }
  .capacity-info {
    margin-bottom: 6px;
  }
  .more-button {
    color: #67c23a;
    margin-right: 8px;
    font-size: 14px;
  }
  .plus-icon {
    font-size: 16px;
    padding: 3px 4px;
    color: black;
    background-color: #67c23a;
  }
  .nftcard {
    width: 220px;
    height: 195px;
    border: 1px solid #67c23a;
  }
  .create-collections {
    margin-right: 25px;
  }
}
</style>
