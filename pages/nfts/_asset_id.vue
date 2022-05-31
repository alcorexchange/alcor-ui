<template lang="pug">
.j-container.nftburnable
  nuxt-link(:to='"/wallet-inventory/nfts"', :exact='true')
    a#return-btn Return
  .page-header.d-flex.justify-content-between.row
    .page-header_text
      p Visuals
    .page-header_text.lg-8.md-4.sm-12.xm-12.col-8(style='padding-left: 45px')
      span.ml-6 Details
  .d-flex.justify-content-between
    .nft-image-container.border-radius5
      .nft-image(v-if='loading')
        CustomSkeletonVue.mt-2.mx-auto(
          v-if='loading',
          :width='249',
          :height='249'
        )
      .nft-image(v-else-if='imageBackground', :style='imageBackground')
      .nft-image(
        v-else,
        :style='{ backgroundImage: `url(${require("~/assets/images/nft.svg")})` }'
      )
      CustomSkeletonVue.mt-2.mx-auto(v-if='loading', :width='65', :height='65')
      button.btn.nft1-container(v-else)
        .nft1-image(v-if='thumbnailImage', :style='thumbnailImage')
        .nft1-image(
          v-else,
          :style='{ backgroundImage: `url(${require("~/assets/images/nft_sm.svg")})` }'
        )
    .nft-info.border-radius5.d-flex.flex-column.justify-content-between
      .d-flex.justify-content-between
        .other-info
          .nft
            label.description-title NFT Name
            CustomSkeletonVue(v-if='loading', :width='120', :height='20')
            h4.description-name(v-else) {{ assetData.name }}
          .nft
            label.description-title ID
            CustomSkeletonVue(v-if='loading', :width='120', :height='20')
            h4(v-else) {{ assetData.asset_id }}
          .nft
            label.description-fee Collection Name
            CustomSkeletonVue(v-if='loading', :width='120', :height='20')
            p.wax-exchange(v-else) {{ assetData.collection.name }}
          .nft
            label.description-fee Schema Name
            CustomSkeletonVue(v-if='loading', :width='120', :height='20')
            p.wax-exchange(v-else) {{ assetData.schema.schema_name }}
          .nft
            label.description-fee Backed Tokens
            CustomSkeletonVue(v-if='loading', :width='120', :height='20')
            p.token-exchange(
              v-else-if='!loading && backedToken',
              v-for='(item, index) in backedToken',
              :key='index'
            ) {{ item.amount + " " + item.token_symbol }}
            p.token-exchange(v-else) None
        .description-info
          .nft
            label.description-title Owner
            CustomSkeletonVue(v-if='loading', :width='120', :height='20')
            p.wax-exchange(v-else) {{ assetData.owner }}
          .nft
            label.description-title Mint Number
            br
            CustomSkeletonVue(v-if='loading', :width='120', :height='20')
            span.wax-exchange.mr-2.d-flex.align-items-center(v-else)
              span {{ assetData.template_mint }} of {{ assetData.template.issued_supply }} (max: {{ assetData.template.max_supply }}) -
              span.color-red.ml-1 {{ assetData.template.issued_supply - assetData.template_mint }}
              img(src='~/assets/images/fire.svg')
          .nft.mt-2
            label.description-title Template ID
            CustomSkeletonVue(v-if='loading', :width='120', :height='20')
            p.wax-exchange(v-else) {{ "#" + assetData.template.template_id }}
          .nft
            p.description-title.mb-0 Propertise
            CustomSkeletonVue(v-if='loading', :width='120', :height='20')
            div(v-else)
              div(v-if='assetData.template.is_transferable')
                img(src='~/assets/images/double_arrow.svg')
                span.ml-2.fs-18 Transfer
              div(v-if='assetData.template.is_burnable')
                img(src='~/assets/images/fire.svg')
                span.ml-2.fs-18 Burnable
      .d-flex.button
        .burn-btn
          img(src='~/assets/images/fire.svg')
          span Burn
        button.btn.tokens-btn(@click='() => (this.show_modal = true)') Back tokens
        .create-collection-btn
          img(src='~/assets/images/tag.svg')
          | List On Market
  .row.attribute
    .attribute.col-4
      p Attribute
    .history.col-8
      p History
  .d-flex.justify-content-between
    .nft-Name-container.border-radius5
      div(v-if='loading')
        .d-flex.align-items-center.attr(v-for='item in 4', :key='item')
          CustomSkeletonVue(:width='80', :height='20')
          CustomSkeletonVue(:width='200', :height='20')
      .d-flex.attr(
        v-else,
        v-for='(item, index) in attributeKeys',
        :key='index'
      )
        span.col-4.text-capitalize {{ (item === "img" ? "image" : item) + ":" }}
        span.col-8.text-detail(
          v-if='String(assetData.data[item]).indexOf("https:") === 0'
        )
          a.color-green(target='_blank', :href='assetData.data[item]') {{ assetData.data[item] }}
        span.col-8.text-detail(v-else) {{ assetData.data[item] }}
    .nft-transfer.border-radius5
      el-tabs.h-100.burnable-tab-pane
        el-tab-pane(label='Transfers')
          .row
            .col-2
              h5 Event
            .col-6
              h5.pl-2 Data
            .col-4.pl-0
              h5 Date
          TransferRow(
            v-for='(item, index) in transferData',
            :key='index',
            :data='item'
          )
        el-tab-pane(label='Sales')
          .row
            .col-2
              h5 Event
            .col-6
              h5.pl-2 Data
            .col-4.pl-0
              h5 Date
          SalesRow(
            v-for='(item, index) in salesData',
            :key='index',
            :data='item'
          )
        el-tab-pane(label='Updates')
          h1 Updates
        el-tab-pane(label='Logs')
          .row
            .col-2
              h5 Event
            .col-6
              h5.pl-2 Data
            .col-4.pl-0
              h5 Date
          LogsRow(
            v-for='(item, index) in logsData',
            :key='index',
            :data='item'
          )
  .d-flex.justify-content-between.row.mt-65.ml-0.mb-1(style='width: 100%')
    .col-4.price-chart.pl-0
      p Price Chart
    .col-7.chart-topline
      .d-flex.justify-content-between
        .chart-items
          p.text-white.mb-0 Lowest Listing:
          p.weight-400
            span.color-yellow {{ lowestSales }} WAX
            | &nbsp;/&nbsp;
            span.color-green ${{ $systemToUSD(lowestSales) }}
        .chart-items
          p.text-white.mb-0 Lowest Sale:
          p.weight-400
            span.color-yellow {{ lowestSales }} WAX
            | &nbsp;/&nbsp;
            span.color-green ${{ $systemToUSD(lowestSales) }}
        .chart-items
          p.text-white.mb-0 Highest Listing:
          p.weight-400
            span.color-yellow {{ highestSales }} WAX
            | &nbsp;/&nbsp;
            span.color-green ${{ $systemToUSD(highestSales) }}
        .chart-items
          p.text-white.mb-0 Highest Sale:
          p.weight-400
            span.color-yellow {{ highestSales }} WAX
            | &nbsp;/&nbsp;
            span.color-green ${{ $systemToUSD(highestSales) }}
  NFTBackModal(:show_modal='show_modal', :handleCloseModal='handleCloseModal')
  .d-flex.justify-content-between
    Chart(
      :charts='chartData',
      v-if='chartData.length',
      tab='Price',
      period='24H'
    )
    CustomSkeletonVue(v-else, :width='970', :height='588')
</template>
<script>
import TransferRow from '~/components/nft_markets/TransferRow'
import SalesRow from '~/components/nft_markets/SalesRow'
import LogsRow from '~/components/nft_markets/LogsRow'
import NFTBackModal from '~/components/modals/NFTBack'
import Chart from '~/components/nft_markets/Chart'
import CustomSkeletonVue from '~/components/CustomSkeleton'

export default {
  components: {
    TransferRow,
    SalesRow,
    NFTBackModal,
    Chart,
    LogsRow,
    CustomSkeletonVue,
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
    }
  },
  computed: {
    imageBackground() {
      if (this.assetData && this.assetData.data.img) {
        return {
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundImage: this.assetData.data.img.includes('https://')
            ? this.assetData.data.img
            : 'url(https://ipfs.atomichub.io/ipfs/' +
              this.assetData.data.img +
              ')',
        }
      } else return false
    },
    thumbnailImage() {
      if (this.assetData && this.assetData.data.img) {
        return {
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundImage: this.assetData.data.img.includes('https://')
            ? this.assetData.data.img
            : 'url(https://ipfs.atomichub.io/ipfs/' +
              this.assetData.data.img +
              ')',
        }
      } else return false
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
    },
    backedToken() {
      if (this.assetData.backed_tokens && this.assetData.backed_tokens.length) {
        return this.assetData.backed_tokens.map((item) => {
          return {
            token_contract: item.token_contract,
            amount: item.amount / Math.pow(10, item.token_precision),
            token_symbol: item.token_symbol,
          }
        })
      } else return []
    },
  },
  mounted() {
    const asset_id = this.$route.params.asset_id
    this.asset_id = asset_id
    this.getSpecificAsset(asset_id)
    this.getAssetsTransfer(asset_id)
    this.getAssetsSales(asset_id)
    this.getAssetsLog(asset_id)
  },
  methods: {
    outofmodalclick(event) {
      if (event.target.classList.contains('nft-modal-container'))
        this.show_modal = false
    },
    handleCloseModal() {
      console.log('handleCloseModal')
      this.show_modal = false
    },
    async getSpecificAsset(asset_id) {
      this.loading = true
      const data = await this.$store.dispatch('api/getSpecificAsset', {
        asset_id,
      })
      this.assetData = data
      this.getTemplatePrice(data.template.template_id)
      this.getChartData(
        data.template.template_id,
        data.schema.schema_name,
        data.is_burnable
      )
      this.attributeKeys = Object.keys(data.data)
      this.loading = false
    },

    async getAssetsTransfer(asset_id) {
      this.loading = true
      const data = await this.$store.dispatch('api/getAssetsTransfer', {
        asset_id,
      })
      this.transferData = data
    },

    async getAssetsSales(asset_id) {
      this.loading = true
      const data = await this.$store.dispatch('api/getAssetsSales', {
        asset_id,
      })
      this.salesData = data
      console.log(data)
    },

    async getAssetsLog(asset_id) {
      this.loading = true
      const data = await this.$store.dispatch('api/getAssetsLog', {
        asset_id,
      })
      this.logsData = data
    },

    async getTemplatePrice(templateID) {
      this.loading = true
      const data = await this.$store.dispatch('api/getTemplatePrice', {
        templateID,
      })
      this.templatePrice = data
    },
    // get price history for a template for NFT sale chart
    async getChartData(template_id, schema_name, burned) {
      const data = await this.$store.dispatch('api/getChartData', {
        template_id,
        schema_name,
        burned,
      })
      this.chartData = data
    },
  },
}
</script>

<style lang="scss">
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
