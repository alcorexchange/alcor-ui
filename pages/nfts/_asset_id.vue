<template lang="pug">
.j-container.nftburnable
  #return-btn.d-flex.gap-4(@click="$router.back()") {{ $t('Return') }]
  .page-header.d-flex.justify-content-between.row
    .page-header_text
      p {{ $t('Visuals') }}
    .page-header_text.lg-8.md-4.sm-12.xm-12.col-8(style='padding-left: 45px')
      span.ml-6 {{ $t('Details') }}
  .d-flex.justify-content-between
    .nft-image-container.border-radius5
      .nft-image(v-if='loading')
        vue-skeleton-loader(
          :width='249',
          :height='249',
          animation='wave',
          wave-color='rgba(150, 150, 150, 0.1)',
          :rounded='true'
        )
      .preview(v-else-if='previewImage' :src='previewImage')
        img(v-if="previewImage.type == 'img'" :src="previewImage.value.replace('120x120', '370x370')")
        video(v-else autoplay='true', loop='true' :style="{ height: '250px', margin: '0 auto', width: '100%' }")
          source(:src="previewImage.value" type='video/mp4')
      img.nft-image(
        src="~/assets/images/nft.svg"
        v-else,
      )
      vue-skeleton-loader.mt-2.mx-auto(
        v-if='loading',
        :width='65',
        :height='65',
        animation='wave',
        wave-color='rgba(150, 150, 150, 0.1)',
        :rounded='true'
      )
      div(v-else)
        .d-flex.align-items-center.justify-content-center.gap-16(v-if="thumbnailUrls" )
          template(v-for="({ type, value }, idx) in thumbnailUrls")
            img.thumbnail(v-if="type == 'img'" :src="value" :class="{active: idx === active}" @click="active = idx")
            video.thumbnail(v-else autoplay='true', loop='true' :class="{active: idx === active}" @click="active = idx")
              source(:src="value" type='video/mp4')

        video.content(v-else-if="videoBackground" autoplay='true', loop='true' :style="{ height: '75px', padding: '5px', border: '1px solid var(--main-action-green)' , margin: '0 auto', width: '100%' }")
          source(:src="videoBackground" type='video/mp4')
        img.nft1-image(
          src="~/assets/images/nft_sm.svg"
          v-else,
          :style='{ height: "75px", padding: "5px", border: "1px solid var(--main-action-green)"  }'
        )
    .nft-info.border-radius5.d-flex.flex-column.justify-content-between
      .d-flex.justify-content-between.w-100.gap-16
        .other-info
          .nft
            label.description-title {{ $t('NFT Name') }}
            vue-skeleton-loader(
              v-if='loading',
              :width='120',
              :height='20',
              animation='wave',
              wave-color='rgba(150, 150, 150, 0.1)'
            )
            h4.description-name(v-else) {{ assetData.name }}
          .nft
            label.description-title ID
            vue-skeleton-loader(
              v-if='loading',
              :width='120',
              :height='20',
              animation='wave',
              wave-color='rgba(150, 150, 150, 0.1)'
            )
            h4(v-else) {{ assetData.asset_id }}
          .nft
            label.description-fee {{ $t('Collection Name') }}
            vue-skeleton-loader(
              v-if='loading',
              :width='120',
              :height='20',
              animation='wave',
              wave-color='rgba(150, 150, 150, 0.1)'
            )
            p.wax-exchange(v-else) {{ assetData.collection.name }}
          .nft
            label.description-fee {{ $t('Schema Name') }}
            vue-skeleton-loader(
              v-if='loading',
              :width='120',
              :height='20',
              animation='wave',
              wave-color='rgba(150, 150, 150, 0.1)'
            )
            p.wax-exchange(v-else) {{ assetData.schema.schema_name }}
          .nft
            label.description-fee {{ $t('Backed Tokens') }}
            vue-skeleton-loader(
              v-if='loading',
              :width='120',
              :height='20',
              animation='wave',
              wave-color='rgba(150, 150, 150, 0.1)'
            )
            p.token-exchange(
              v-else-if='!loading && backedToken',
              v-for='(item, index) in backedToken',
              :key='index'
            ) {{ item.amount + " " + item.token_symbol }}
            p.token-exchange(v-else) {{ $t('None') }}
        .description-info
          .nft
            label.description-title {{ $t('Owner') }}
            vue-skeleton-loader(
              v-if='loading',
              :width='120',
              :height='20',
              animation='wave',
              wave-color='rgba(150, 150, 150, 0.1)'
            )
            account-link(v-else :accountName="assetData.owner").mb-3
          .nft
            label.description-title {{ $t('Mint Number') }}
            br
            vue-skeleton-loader(
              v-if='loading',
              :width='120',
              :height='20',
              animation='wave',
              wave-color='rgba(150, 150, 150, 0.1)'
            )
            span.wax-exchange.mr-2.d-flex.align-items-center(v-else)
              span {{ assetData.template_mint }} of {{ assetData.template.issued_supply }} (max: {{ assetData.template.max_supply > 0 ? assetData.template.max_supply : '?' }}) -
              span.color-red.ml-1(v-if="burned") {{ burned }}
              img(src='~/assets/images/fire.svg')
          .nft.mt-2
            label.description-title {{ $t('Template ID') }}
            vue-skeleton-loader(
              v-if='loading',
              :width='120',
              :height='20',
              animation='wave',
              wave-color='rgba(150, 150, 150, 0.1)'
            )
            p.wax-exchange(v-else) {{ "#" + assetData.template.template_id }}
          .nft
            p.description-title.mb-0 {{ $t('Propertise') }}
            vue-skeleton-loader(
              v-if='loading',
              :width='120',
              :height='20',
              animation='wave',
              wave-color='rgba(150, 150, 150, 0.1)'
            )
            div(v-else)
              div(v-if='assetData.template.is_transferable')
                img(src='~/assets/images/double_arrow.svg')
                span.ml-2.fs-18 {{$t('Transfer')}}
              div(v-if='assetData.template.is_burnable')
                img(src='~/assets/images/fire.svg')
                span.ml-2.fs-18 {{$t('Burnable') }}
      .d-flex.gap-20.justify-content-end.w-100
        alcor-button(big @click="openBurnModal")
          img(src='~/assets/images/fire.svg')
          span {{$t('Burn') }}
        alcor-button(big @click='openBackModal') {{$t('Back tokens')}}
        alcor-button(access @click="openListingModal")
          i.el-icon-s-shop
            span {{ $t('List On Market') }}
  .row.attribute
    .attribute.col-4
      p {{ $t('Attribute') }}
    .history.col-8
      p {{ $t('History') }}
  .d-flex.justify-content-between
    .nft-Name-container.border-radius5
      div(v-if='loading')
        .d-flex.align-items-center.attr(v-for='item in 4', :key='item')
          vue-skeleton-loader(
            :width='80',
            :height='20',
            animation='wave',
            wave-color='rgba(150, 150, 150, 0.1)'
          )
          vue-skeleton-loader(
            :width='200',
            :height='20',
            animation='wave',
            wave-color='rgba(150, 150, 150, 0.1)'
          )
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
              h5 {{ $t('Event') }}
            .col-6
              h5.pl-2 {{ $t('Data') }}
            .col-4.pl-0
              h5 {{ $t('Date') }}
          TransferRow(
            v-for='(item, index) in transferData',
            :key='index',
            :data='item'
          )
        el-tab-pane(label='Sales')
          .row
            .col-2
              h5 {{ $t('Event') }}
            .col-6
              h5.pl-2 {{ $t('Data') }}
            .col-4.pl-0
              h5 {{ $t('Date') }}
          SalesRow(
            v-for='(item, index) in salesData',
            :key='index',
            :data='item'
          )
        el-tab-pane(label='Updates')
          .row
            .col-2
              h5 {{ $t('Event') }}
            .col-6
              h5.pl-2 {{ $t('Data') }}
            .col-4.pl-0
              h5 {{ $t('Date') }}
          LogsRow(
            v-for='(item, index) in updatesData',
            :key='index',
            :data='item'
          )

        el-tab-pane(label='Logs')
          .row
            .col-2
              h5 {{ $t('Event') }}
            .col-6
              h5.pl-2 {{ $t('Data') }}
            .col-4.pl-0
              h5 {{ $t('Date') }}
          LogsRow(
            v-for='(item, index) in logsData',
            :key='index',
            :data='item'
          )
  .d-flex.justify-content-between.row.mt-65.ml-0.mb-1(style='width: 100%')
    .col-4.price-chart.pl-0
      p {{ $t('Price Chart') }}
    .col-7.chart-topline
      .d-flex.justify-content-between
        .chart-items
          p.mb-0 {{ $t('Lowest Listing') }}:
          p.weight-400
            span.color-yellow {{ lowestSales }} WAX
            | &nbsp;/&nbsp;
            span.color-green ${{ $systemToUSD(lowestSales) }}
        .chart-items
          p.mb-0 {{ $t('Lowest Sale') }}:
          p.weight-400
            span.color-yellow {{ lowestSales }} WAX
            | &nbsp;/&nbsp;
            span.color-green ${{ $systemToUSD(lowestSales) }}
        .chart-items
          p.mb-0 {{ $t('Highest Listing')}}:
          p.weight-400
            span.color-yellow {{ highestSales }} WAX
            | &nbsp;/&nbsp;
            span.color-green ${{ $systemToUSD(highestSales) }}
        .chart-items
          p.mb-0 {{ $t('Highest Sale') }}:
          p.weight-400
            span.color-yellow {{ highestSales }} WAX
            | &nbsp;/&nbsp;
            span.color-green ${{ $systemToUSD(highestSales) }}
  NFTBackModal(
    :show_modal='show_modal',
    :handleCloseModal='handleCloseModal'
  )
  .d-flex.justify-content-between.chart
    Chart(v-if='chartData && chartData.length', :charts='chartData', tab="Price", period="24H")
</template>
<script>
import { mapActions } from 'vuex'
import VueSkeletonLoader from 'skeleton-loader-vue'
import AlcorButton from '~/components/AlcorButton'
import TransferRow from '~/components/nft_markets/TransferRow'
import SalesRow from '~/components/nft_markets/SalesRow'
import LogsRow from '~/components/nft_markets/LogsRow'
import AccountLink from '~/components/AccountLink'
import NFTBackModal from '~/components/modals/NFTBack'
import Chart from '~/components/nft_markets/Chart'

export default {
  components: {
    TransferRow,
    SalesRow,
    NFTBackModal,
    AccountLink,
    Chart,
    VueSkeletonLoader,
    AlcorButton,
    LogsRow
  },

  data() {
    return {
      loading: true,
      show_modal: false,
      assetData: '',
      active: 0,
      burned: null,
      attributeKeys: [],
      salesData: [],
      transferData: [],
      logsData: [],
      updatesData: [],
      templatePrice: [],
      chartData: []
    }
  },
  computed: {
    videoBackground() {
      if (this.assetData && this.assetData.data.video) {
        if (this.assetData.data.video.includes('https://'))
          return this.assetData.data.video
        return `https://ipfs.io/ipfs/${this.assetData.data.video}`
      } else return false
    },
    previewImage() {
      return this.thumbnailUrls
        ? this.thumbnailUrls[this.active || 0]
        : null
    },
    thumbnailImage() {
      if (this.assetData && this.assetData.data.img) {
        return {
          backgroundSize: 'contain',
          backgroundPosition: 'center',
          backgroundImage: this.assetData.data.img.includes('https://')
            ? this.assetData.data.img
            : 'url(https://images.hive.blog/370x370/https://ipfs.io/ipfs/' +
              this.assetData.data.img.replaceAll(' ', '%20') +
              ')'
        }
      } else return false
    },
    thumbnailUrls() {
      return Object.entries(this.assetData.data)
        .filter(([key, value]) => key.includes('img') || key.includes('video'))
        .map(([key, value]) => {
          return key.includes('img') ? ({
            type: 'img',
            value: value.startsWith('https://')
              ? value
              : `https://images.hive.blog/120x120/https://ipfs.io/ipfs/${value
                .trim()
                .replaceAll(' ', '%20'
              )}`
          }) : ({
            type: 'video',
            value: value.startsWith('https://')
              ? value
              : `https://ipfs.io/ipfs/${value
                .trim()
                .replaceAll(' ', '%20'
              )}`
          })
        })
    },
    lowestSales() {
      if (this.templatePrice?.length) {
        return (
          this.templatePrice[0].min /
          Math.pow(10, this.templatePrice[0].token_precision)
        ).toFixed(2)
      } else return 0
    },
    highestSales() {
      if (this.templatePrice?.length) {
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
            token_symbol: item.token_symbol
          }
        })
      } else return []
    }
  },
  mounted() {
    console.log(this.$route)
    const asset_id = this.$route.params.asset_id
    this.asset_id = asset_id
    this.getSpecificAsset(asset_id)
    this.getAssetsTransfer(asset_id)
    this.getAssetsSales(asset_id)
    this.getAssetsLog(asset_id)
  },
  methods: {
    ...mapActions('modal', ['burn', 'back', 'listing']),
    openBackModal() {
      this.back(this.assetData)
    },
    openListingModal() {
      this.listing(this.assetData)
    },
    openBurnModal() {
      this.burn(this.assetData)
    },
    outofmodalclick(event) {
      if (event.target.classList.contains('nft-modal-container'))
        this.show_modal = false
    },
    handleCloseModal() {
      this.show_modal = false
    },
    async getSpecificAsset(asset_id) {
      this.loading = true
      const data = await this.$store.dispatch('api/getSpecificAsset', {
        asset_id
      })
      this.assetData = data
      this.getTemplatePrice(data.template.template_id)
      this.getChartData(
        data.template.template_id,
        data.schema.schema_name,
        data.is_burnable
      )
      this.getTemplateStats(
        data.collection.collection_name,
        data.template.template_id
      )
      this.attributeKeys = Object.keys(data.data)
      this.loading = false
    },

    async getAssetsTransfer(asset_id) {
      this.loading = true
      const data = await this.$store.dispatch('api/getAssetsTransfer', {
        asset_id
      })
      this.transferData = data
    },

    async getTemplateStats(collectionName, templateID) {
      const { burned } = await this.$store.dispatch('api/getTemplateStats', {
        collectionName,
        templateID
      })
      this.burned = burned
    },

    async getAssetsSales(asset_id) {
      this.loading = true
      const data = await this.$store.dispatch('api/getAssetsSales', {
        asset_id
      })
      this.salesData = data
    },

    async getAssetsLog(asset_id) {
      this.loading = true
      const data = await this.$store.dispatch('api/getAssetsLog', {
        asset_id
      })
      this.logsData = data.filter(({ name }) => name !== 'logsetdata')
      this.updatesData = data.filter(({ name }) => name === 'logsetdata')
    },

    async getTemplatePrice(templateID) {
      this.loading = true
      const data = await this.$store.dispatch('api/getTemplatePrice', {
        templateID
      })
      this.templatePrice = data
    },
    // get price history for a template for NFT sale chart
    async getChartData(template_id, schema_name, burned) {
      const data = await this.$store.dispatch('api/getChartData', {
        template_id,
        schema_name,
        burned
      })
      this.chartData = data
    }
  }
}
</script>

<style lang="scss">
.nftburnable {
  .chart {
    height: 450px;
  }

  .weight-400 {
    font-weight: 400 !important;
  }

  .chart-topline {
    background-color: var(--background-color-secondary);
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
    width: 35%;

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
    border-bottom: 1px solid var(--btn-default);
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
    width: 65%;
  }

  .col-4 {
    font-size: 12px;
  }

  .wax-exchange {
    font-weight: 500;
    font-size: 16px;
    color: var(--main-action-green);
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
      word-break: break-word;
    }

    .attr {
      margin-bottom: 10px;
      justify-content: space-between;
      align-items: center;
      padding-right: 0px;
      flex-direction: revert;
      gap: 10px;

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
    background-color: var(--background-color-secondary);
    padding: 24px;
  }

  .nft-Name-container,
  .nft-info.border-radius5 {
    background-color: var(--background-color-secondary);
    padding: 14px;
  }

  .nft {
    width: auto;
    height: auto;
  }

  .nft-image-container,
  .nft-info.border-radius5 {
    background-color: var(--background-color-secondary);
    margin-bottom: 68px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 25px;
  }

  .nft-info.border-radius5 {
    width: 595px;
    min-height: 395px;
  }

  .nft-image {
    height: 250px;
    width: fit-content;
    object-fit: cover;
    background-repeat: no-repeat;
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

  .preview {
    height: 250px;
    display: flex;
    align-items: center;
    img, video {
      width: 100%;
      max-height: 100%;
    }
  }

  .thumbnail {
    height: 75px;
    padding: 5px;
    cursor: pointer;
    object-fit: cover;
    background-repeat: no-repeat;
    background-size: 100%;
    border: 1px solid transparent;
    border-radius: 2px;

    &.active {
      border: 1px solid var(--main-action-green);
    }
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
    margin-top: 12px;
    font-weight: 500;
    font-size: 14px;
    color: #9f979a !important;
    cursor: pointer;
  }

  .page-header h4 {
    margin: 0 !important;
  }

  .page-header {
    margin: 16px 0;
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
    background-color: var(--background-color-secondary);
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
