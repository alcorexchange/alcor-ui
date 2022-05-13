<template lang="pug">
.j-container.schematemplate
  div
    nuxt-link(:to='"/nft-market/creatingschema"' :exact="true")
      a#return-btn Return - Collection: Alcorex
  .page-header.d-flex.justify-content-between.row
    .page-header_text.lg-8.md-4.sm-12.xm-12
      h4 Template:
        span.color-green &nbsp;#204102
      p Templates can be applied to NFTs, the attributes will then be changed accordingly.
    .page-header-progress.lg-4.md-4.sm-12.xm-12
      .progress-info
        .info-capacity.d-flex.justify-content-between
          div
            span.ques-symbol.border-radius5 ?
            span RAM: 72.27 / 99 KB
          div
            span.more-button Buy more
            span.plus-icon.border-radius5 +
        b-progress(:max='100')
          b-progress-bar(:value='value' :label='`${value}%`')
  div
    h4.nft-title Details
    .d-flex
      SchemaCard(:cardData="cardData")
      .golden-card-content.radius10
        h4.color-green Golden
        h4 Alcorex
        h5 (3 Attributes)
    .d-flex.justify-content-between.align-items-end.template-container(:style="{marginTop: '100px'}")
      div
        h4.nft-title Templates:
        .d-flex
          .nftcard.create-collections.radius10.d-flex.justify-content-center.align-items-center.template-card
            nuxt-link(:to='"/nft-market/newtemplate"' :exact="true")
              .card-content
                .plus-round-background(:style="{ backgroundImage:`url(${require('~/assets/images/plus_round_icon.svg')})`}")
                h4.color-white New Templates
      div
        h5.color-white NFTs
        .nftcard.create-collections.radius10.d-flex.justify-content-center.align-items-center
          .card-content
            .plus-round-background(:style="{ backgroundImage:`url(${require('~/assets/images/plus_round_icon.svg')})`}")
            h5 Mint NFT
</template>

<script>
import { BProgress, BProgressBar } from 'bootstrap-vue'
import TemplateCard from '~/components/nft_markets/TemplateCard'

export default {
  components: {
    BProgress,
    BProgressBar,
    TemplateCard,
  },

  data() {
    return {
      cardData: {
        maker: 'flfum.wam',
        creator: 'AlcorExchange',
        showNFTdata: true,
        showNFTvalue: false,
        nftvalue: 0,
        btnname: 'View in market',
      },
      value: 73,
    }
  },
}
</script>

<style lang="scss">
.schematemplate {
  .radius10 {
    border-radius: 10px;
  }
  .golden-card-content {
    width: 220px;
    height: 195px;
    border: 1px solid #67C23A;
    background-color: #202021;
    margin-left: 37px;
    padding-top: 43px;
    font-weight: 700;
    font-size: 24px;
    text-align: center;
    h4 {
      margin: 10px 0 !important;
    }
    h5 {
      color: #9F979A;
    }
  }
  .template-container {
    width: 70%;
  }
  .color-white {
    color: #FFF !important;
  }
  .nft-title {
    margin: 32px 0;
  }
  .el-input__suffix {
    right: 65px !important;
  }
  .theme-dark .el-select-dropdown,
  .el-input__inner {
    height: 48px;
    background-color: #333;
    border-radius: 5px;
    text-align: center;
  }
  .el-select-dropdown__item {
    text-align: center !important;
  }
  .el-select {
    width: 233px;
  }
  .border-radius5 {
    border-radius: 5px;
  }
  div.row {
    margin: 0;
  }
  .minus-button {
    position: absolute;
    transform: translate(-30px,0);
    width: 20px;
    height: 20px;
    cursor: pointer;
  }

  input.input-attribute {
    color: #c4c4c4;
    background-color: #161617;
    margin-right: 12px !important;
  }
  .add-button {
    width: 100%;
    font-size: 14px;
    margin-top: 18px;
    text-align: center;
    color: #c4c4c4;
    background-color: #161617;
    border: 1px solid #67C23A;
    padding: 16px;
    height: 48px;
    border-radius: 8px;
    cursor: pointer;
  }
  .custom-select {
    background: url('~/assets/images/under.svg') right 80px center/8px 10px no-repeat;
  }
  .input-attribute,
  .name-button,
  .type-button {
    color: white;
    border: none;
    width: 233px;
    height: 48px;
    font-size: 16px;
    padding: 10px 0;
    text-align: center;
    border-radius: 8px;
    background-color: #333;
    margin: 6px 0;
  }
  .name-button {
    margin-right: 12px;
    color: var(--cancel);
  }
  .type-button {
    color: white;
  }
  .create-schema-btn {
    width: 233px;
    height: 32px;
    background-color: #67C23A;
    border-radius: 4px;
    text-align: center;
    font-weight: 500;
    color: black;
    padding: 3px 23px;
    cursor: pointer;
  }
  input {
    width: 233px;
    height: 24px;
    border-radius: 2px;
    border: none;
    margin: 6px 0 !important;
    color: var(--cancel);
    background-color: var(--background-color-third);
  }
  .color-red {
    color: red;
  }
  .color-green {
    color: #67C23A;
  }
  div.page-header_text h4 {
    margin-bottom: 9px !important;
  }
  .page-header_text {
    margin-bottom: 32px;
  }
  .other-info {
    width: 35%;
    h4 {
      font-size: 20px;
    }
  }
  .description-info {
    width: 55%;
  }
  .wax-exchange {
    font-weight: 700;
    font-size: 20px;
    line-height: 15px;
    text-decoration-line: underline;
    color: #67C23A;
  }
  .description-name,
  .wax-exchange
  {
    margin-bottom: 32px !important;
  }
  .description-fee,
  .description-title {
    font-size: 14px;
    color: var(--cancel);
  }
  .description {
    font-size: 16px;
  }
  .create-collection-btn {
    float: right;
    text-align: center;
    padding: 14px 23px;
    width: 154px;
    height: 48px;
    color: #000;
    font-size: 13px;
    font-weight: 500;
    background: #67C23A;
    border-radius: 8px;
    cursor: pointer;
  }
  .nft-image-container {
    padding: 24px 25px 25px 25px;
    width: 300px;
    height: 300px;
    border-radius: 10px;
  }
  .nft-image-container,
  .nft-info {
    background-color: #202021;
    padding: 24px;
  }
  .nft-info {
    width: calc(100% - 330px);
  }
  .nft-image {
    width: 251px;
    height: 251px;
    object-fit: cover;
  }
  .schemas-title {
    margin: 43px 0;
    font-weight: 500;
    font-size: 20px;
  }
  .plus-round-background
  {
    width: 70px;
    height: 70px;
    margin: auto;
  }
  .card-content {
    margin-top: 23px;
    font-weight: 700;
    font-size: 24px;
    text-align: center;
    h4,
    h5 {
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
    height: 300px;
    border: 1px solid #67C23A;
  }
  .template-card {
    height: 174px;
  }
  .create-collections {
    margin-right: 25px;
    background-color: #202021;
  }
}
</style>
