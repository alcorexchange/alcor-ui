<template lang="pug">
.j-container.nftburnable
  .nft-modal-container(v-if="show_modal" @click="outofmodalclick")
    .nft-modal
      i.el-icon-close(@click="show_modal = !show_modal")
      p.modal-header
        img(src="../../assets/images/poker_chip.svg")
        |Back NFT
      .row
        .d-flex.justify-content-between
          .col-5
            TradeOfferCard(:data="{maker: 'gchad.wam', id:'50',nobtngroup:true}" price=0)
          .col-7
            .nft-info
              h5 Back NFT with tokens
              input(placeholder="Amount of WAX")
              p Once you back an NFT with tokens you can only free the tokens by burning the NFT!
                img.pl-1(src='~/assets/images/fire.svg' alt='')
            .back-nft-btn.text-center Back NFT
  div
  nuxt-link(:to='"/nft-market/createcollection"', :exact='true')
    a#return-btn Return
  .page-header.d-flex.justify-content-between.row
    .page-header_text
      p Visuals
    .page-header_text.lg-8.md-4.sm-12.xm-12.col-8(style="padding-left:45px")
      span.ml-6 Details
  .d-flex.justify-content-between
    .nft-image-container.border-radius5
      .nft-image(:style="{ backgroundImage:`url(${require('~/assets/images/nft.svg')})`}")
      .nft1-container
        .nft1-image(:style="{ backgroundImage:`url(${require('~/assets/images/nft_sm.svg')})`}")
    .nft-info.border-radius5
      .d-flex.justify-content-between
        .other-info
         .nft
          label.description-title NFT Name
          h4.description-name SystemBlock
         .nft
          label.description-title ID
          h4 SystemBlock
         .nft
          label.description-fee Collection Name
          p.wax-exchange Alcorex
         .nft
          label.description-fee Schema Name
          p.wax-exchange Default
         .nft
          label.description-fee Backed Tokens
          p.token-exchange 300 WAX
        .description-info
         .nft
          label.description-title Owner
          p.wax-exchange Alcorex
         .nft
          label.description-title Mint Number
          br
          span.wax-exchange.mr-2 1
          | of 10 (max: 10) -
          span.color-red &nbsp;5
          img(src='~/assets/images/fire.svg')
         .nft.mt-2
          label.description-title Template ID
          p.wax-exchange #21891
         .nft
          div#pro
          p.description-title.mb-0 Propertise
          img(src='~/assets/images/double_arrow.svg')
          span.ml-2.fs-18 Transfer
          div#burn
          img(src='~/assets/images/fire.svg')
          span.ml-2.fs-18 Burnable
      nuxt-link(:to='"/nft-market/createcollection"', :exact='true')
      .d-flex.button
        .burn-btn
            img(src='~/assets/images/fire.svg')
            span Burn
        .tokens-btn Back tokens
        .create-collection-btn
          img(src='~/assets/images/tag.svg')
          |List On Market
  .row.attribute
    .attribute.col-4
      p Attribute
    .history.col-8
      p History
  .d-flex.justify-content-between
    .nft-Name-container.border-radius5
      .d-flex.align-items-center.attr
          span.col-4 Name:
          span.col-8 SystemBlock
      .d-flex.align-items-center.attr
          span.col-4 Image:
          span.col-8.break-word QmeqCY8TZk1vRmpGG9udfsgsdgg
      .d-flex.align-items-center.attr
          span.col-4 Description:
          span.col-8 The official Alcor DEX NFT collection
      .d-flex.align-items-center.attr
          span.col-4 Rarity:
          span.col-8 Default
      .d-flex.align-items-center.attr
          span.col-4 Telegram:
          span.col-8
            a.color-green(href='https://t.me/alcorexchange') https://t.me/alcorexchange
      .d-flex.align-items-center.attr
          span.col-4 Twitter:
          span.col-8
            a.color-green(href='https://twitter.com/alcorexchange') https://twitter.com/alcorexchange
    .nft-transfer.border-radius5
        el-tabs.h-100.burnable-tab-pane
            el-tab-pane(label="Transfers")
                .row
                    .col-2
                      h5 Event
                    .col-6
                      h5.pl-2 Data
                    .col-4.pl-0
                      h5 Date
                TransferRow(v-for="item in [{org_token:'fire.svg', new_token:'fire.svg',org_owner:'gchad.wam', new_owner:'flfum.wam', date:'10/25/2021, 6:49 PM'}]" :key="item" :data="item")
            el-tab-pane(label="Sales")
                .row
                    .col-2
                      h5 Event
                    .col-6
                      h5.pl-2 Data
                    .col-4.pl-0
                      h5 Date
                SalesRow(v-for="item in [{org_token:'fire.svg', new_token:'fire.svg',org_owner:'gchad.wam', new_owner:'flfum.wam', date:'10/25/2021, 6:49 PM'}]" :key="item" :data="item")
            el-tab-pane(label="Updates")
                h1 Updates
            el-tab-pane(label="Logs")
                h1 Logs
  .d-flex.justify-content-between.row.mt-65.ml-0.mb-1(style="width:100%")
    .col-4.price-chart.pl-0
      p Price Chart
    .col-7.chart-topline
      .d-flex.justify-content-between
        .chart-items
          p.text-white.mb-0 Lowest Listing:
          p.weight-400
            span.color-yellow 1.90 WAX
            | &nbsp;/&nbsp;
            span.color-green $1.34
        .chart-items
          p.text-white.mb-0 Lowest Sale:
          p.weight-400
            span.color-yellow 1.90 WAX
            | &nbsp;/&nbsp;
            span.color-green $1.34
        .chart-items
          p.text-white.mb-0 Highest Listing:
          p.weight-400
            span.color-yellow 1.90 WAX
            | &nbsp;/&nbsp;
            span.color-green $1.34
        .chart-items
          p.text-white.mb-0 Highest Sale:
          p.weight-400
            span.color-yellow 1.90 WAX
            | &nbsp;/&nbsp;
            span.color-green $1.34
  .d-flex.justify-content-between
    TempChart
</template>
<script>
import TransferRow from '~/components/nft_markets/TransferRow'
import SalesRow from '~/components/nft_markets/SalesRow'
import TradeOfferCard from '~/components/nft_markets/TradeOfferCard'
import TempChart from '~/components/nft_markets/TempChart'
export default {
  components: {
    TransferRow,
    SalesRow,
    TradeOfferCard,
    TempChart,
  },

  data() {
    return {
      show_modal: true,
      value: 73,
    }
  },
  methods: {
    outofmodalclick (event) {
      if (event.target.classList.contains('nft-modal-container'))
        this.show_modal = false
    },
  }
}
</script>

<style lang="scss">
.nftburnable {
  .weight-400 {
    font-weight: 400 !important;
  }
  .nft-modal-container {
    .back-nft-btn {
      cursor: pointer;
      margin-top: 157px;
      padding: 13px;
      width: 100%;
      border-radius: 8px;
      background-color: #333;
    }
    .tradeoffercard {
      background-color: #161617;
      border-radius: 8px;
    }
    .modal-header {
      font-size: 14px;
      font-weight: 500;
      display: block !important;
      margin-bottom: 27.5px;
      img {
        margin-right: 5px;
      }
    }
    div.modal-header > .main-img {
      width: 235px;
      height: 235px;
    }
    background-color: rgba(0,0,0,0.8);
    position: fixed;
    z-index: 999;
    width: 100vw;
    height: 100vh;
    top: 0;
    left: 0;
    .el-icon-close {
      position: absolute;
      top: 14px;
      right: 10px;
      cursor: pointer;
    }
    .modal-header {
      border-color: #3C3C43;
    }
    .nft-modal {
      border-radius: 8px;
      background-color: #212121;
      position: fixed;
      width: 605px;
      height: 440px;
      padding: 20px 18px;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    }
    .normal-card header {
      padding: 5px 0;
    }
    .nft-info {
      h5 {
        font-size: 14px;
      }
      input {
        color: #9F979A;
        width: 100%;
        padding: 2px 8px;
        background-color: #161617;
        margin: 12px 0;
        border: none;
        border-radius: 2px;
      }
      p {
        color: #FF4949;
        font-size: 12px;
      }
    }
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
  .el-tabs__item   {
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
    color: #F89022;
  }
  .color-green {
    color: #66C167 !important;
  }
  .attr span:first-child {
    font-size: 18px;
  }
  .attr span:last-child {
    font-size: 14px;
  }
  .color-red {
    color: #FF4949;
    margin-right: 5px;
  }
  #tv_chart_container {
    width: 100%;
  }
  .border-radius5 {
    border-radius: 5px;
  }
  .pro{
    span{
        margin-left:5px;
    }
  }
  .nftcard.create-collections.border-radius5 h4 {
    color: white;
  }
  .attribute{
    margin-bottom: 12px !important;
    }
  div.page-header_text h4,p {
    font-size: 24px;
    color: #999999;
  }
  .page-header_text {
    margin-bottom: 20px;
    .ml-6{
        font-size:24px;
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
    font-size:12px;
    margin-top: 9px;
  }
  .col-2 > h5 {
    margin-left: 16px;
  }
  .el-tabs__item{
    width: 130px !important;
    text-align:center;
    border-bottom: 1px solid #333;
  }
  .button{
    width: 380px;
    height: auto;
    margin-left: 181px;
    margin-top: 20px;
  }
  .burnable-tab-pane .el-tabs__active-bar{
    background-color: green !important;
  }
  .description-info {
    width: 50%;
  }
  .col-4{
    font-size: 12px;
  }
  .wax-exchange {
    font-weight: 500;
    font-size: 16px;
    line-height: 10px;
    color: #34fb24;
  }
  .token-exchange {
    font-weight: 500;
    font-size: 16px;
    line-height: 10px;
    color: #dd6f00
  }
  .description-name,
  .wax-exchange
  {
    margin-bottom: 15px !important;
  }
  .description-fee,
  .description-title {
    font-size: 14px;
    color: var(--cancel);
    margin-bottom:5px;
    span{
       margin-left:4px;
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
    span{
        margin-left:4px;
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
    margin:0rem 1rem;
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
    background: #67C23A;
    border-radius: 8px;
    cursor: pointer;
  }
   .nft-image-container {
    padding: 26px 48px 0px 48px;
    width: 345px;
    height: 395px;
    border-radius: 10px;
  }
  .nft-Name-container{
    padding: 9px 9px 15px 15px;
    width: 345px;
    height: 311px;
    border-radius: 10px;
   .attr{
       margin-bottom:10px;
       justify-content: space-between;
       padding-right: 0px;
       flex-wrap: wrap;
       flex-direction: revert;
      .col-4{
          width: 33%;
      }
      .col-8{
       font-size: 14px;
       width: 67%;
      }
      span {
        padding: 0 !important;
      }
   }
  }
 .nft-transfer{
    padding: 24px 25px 25px 25px;
    width: 595px;
    height: 311px;
    border-radius: 10px;
  }
  .nft-transfer{
    background-color: #202021;
    padding: 24px;
  }
  .nft-Name-container,
  .nft-info.border-radius5 {
    background-color: #202021;
    padding: 14px;
  }
  .nft{
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
    height: 395px;
  }
  .nft-image {
    width: 249px;
    height: 249px;
    object-fit: cover;
    background-repeat: no-repeat;
    margin-left:28px;
    margin-top:16px;
  }
  .nft1-container {
    border: 1px solid #67C23A;
    border-radius: 5px;
    padding: 5px;
    width: 79px;
    height: 79px;
    margin-left:114px;
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
    margin-bottom:10px;
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
  .plus-round-background
  {
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
    color: #67C23A;
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
      background-color: #67C23A;
      color: black;
    }
  }
  .ques-symbol {
    padding: 6px;
    margin-right: 6px;
    color: #9F979A;
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
    color: #67C23A;
    margin-right: 8px;
    font-size: 14px;
  }
  .plus-icon {
    font-size: 16px;
    padding: 3px 4px;
    color: black;
    background-color: #67C23A;
  }
  .nftcard {
    width: 220px;
    height: 195px;
    border: 1px solid #67C23A;
  }
  .create-collections {
    margin-right: 25px;
}
}
</style>
