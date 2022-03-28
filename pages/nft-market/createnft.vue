<template lang="pug">
.j-container.createnft
  div
    nuxt-link(:to='"/nft-market"' :exact="true")
      a#return-btn Return
  .page-header.d-flex.justify-content-between.row
    .page-header_text.lg-8.md-4.sm-12.xm-12
      h4 My Collections
      p All NFTs are a part of a larger collection, please create a new collection or add
        |  to an existing one.
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
  .card-group.d-flex.align-items-start
    nuxt-link(:to='"/nft-market/createcollection"' :exact="true")
      .nftcard.create-collections.border-radius5
        .card-content
          .plus-round-background(:style="{ backgroundImage:`url(${require('~/assets/images/plus_round_icon.svg')})`}")
          h4 Create <br>Collection
    .nftcard.almemes.border-radius5
      .card-content
        .almemes-background(:style="{ backgroundImage:`url(${require('~/assets/images/almemes_icon.svg')})`}")
        h4 Almemes
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
.createnft {
  .border-radius5 {
    border-radius: 5px;
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
    color: #67C23A !important;
  }
  .card-content {
    margin-top: 50%;
    transform: translate(0, -20%);
    font-weight: 700;
    font-size: 24px;
    text-align: center;
    h4 {
      margin: 10px 0;
      color: white;
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
  .create-collections {
    margin-right: 25px;
  }
}
</style>
