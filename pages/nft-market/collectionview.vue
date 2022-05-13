<template lang="pug">
.j-container.collectionview
  div
  nuxt-link(:to='"/nft-market/createcollection"' :exact="true")
    a#return-btn Return - Edit Collection
  .page-header.d-flex.justify-content-between.row
    .page-header_text.lg-8.md-4.sm-12.xm-12
      h4 Collection: Alcorex
      p Edit your collection or add schemas and NFTs.
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
  .d-flex.justify-content-between
    .nft-image-container.border-radius5
      .nft-image(:style="{ backgroundImage:`url(${require('~/assets/images/nft.svg')})`}")
    .nft-info.border-radius5
      .d-flex.justify-content-between
        .other-info
          p.description-title Display Name
          h4.description-name Alcorex
          p.description-title Website URL
          p.wax-exchange wax.alcor.exchange
          p.description-fee Collection Fee
          h4 3.5%
        .description-info
          p.description-title Description
          p.description This is the official Alcor NFT collection made by our team.
          <br> Alcor Diamonds for all, who knows, maybe
          | they’ll have a use case too one day (;
      nuxt-link(:to='"/nft-market/createcollection"' :exact="true")
        .create-collection-btn Edit Collection
  .schemas-title Schemas
  .card-group.d-flex.align-items-start
    nuxt-link(:to='"/nft-market/creatingschema"' :exact="true")
      .nftcard.create-collections.border-radius5
        .card-content
          .plus-round-background(:style="{ backgroundImage:`url(${require('~/assets/images/plus_round_icon.svg')})`}")
          h4 Create <br> Collection
</template>

<script>
import { BProgress, BProgressBar } from 'bootstrap-vue'

export default {
  components: {
    BProgress,
    BProgressBar
  },

  data() {
    return {
      value: 73,
    }
  },
}
</script>

<style lang="scss">
.collectionview {
  .border-radius5 {
    border-radius: 5px;
  }
  .nftcard.create-collections.border-radius5 h4 {
    color: white;
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
