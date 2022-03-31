<template lang="pug">
.schemacard
  .normalcard.radius10
    header.d-flex.justify-content-between.mb-1
      div
        img(:style="{width:'21px',height:'21px'}" src='~/assets/images/small_shape.svg')
        span.card-title {{cardData.maker}}
      div
        img(src='~/assets/images/double_arrow.svg' alt='')
        img.fire-icon(src='~/assets/images/fire.svg' alt='')
    .main-img.radius10(:style="{ backgroundImage:`url(${require('~/assets/images/nft_purple.png')})`}")
    .offer-information
      .d-flex.justify-content-between.align-items-end
        p AlcWave
        p Alcorex
      .d-flex.justify-content-between.creator-item
        .d-flex
          p Creator:
          p {{ cardData.creator }}
        p(v-if='cardData.showNFTvalue') {{ cardData.nftvalue }} NFTs
      .nft-checkbox-item.d-flex.align-items-center(v-if='cardData.showNFTdata')
        p NFTs can be Transferred
        .form-group_image(:style="{ backgroundImage:`url(${require('~/assets/images/fire.svg')})`}")
      .nft-checkbox-item.d-flex.align-items-center(v-if='cardData.showNFTdata')
        p NFTs can be Burned
        .form-group_image(:style="{ backgroundImage:`url(${require('~/assets/images/double_arrow.svg')})`}")
    button.btn-border--green.radius6 {{ cardData.btnname }}
</template>

<script>
import { mapState } from 'vuex'

export default {
  props: ['cardData'],
}
</script>

<style lang="scss">
.schemacard {
  .nft-checkbox-item {
    color: var(--cancel);
  }
  .offer-information>div:first-child>p:first-child {
    font-size: 20px;
    color: var(--main-green);
  }
  .creator-item {
    font-size: 13px;
    div > p:first-child {
      color: #9F979A;
      margin-right: 5px;
    }
    div {
      font-size: 10px;
    }
  }
  .offer-information > div {
    margin-bottom: 8px;
  }
  .form-group_image {
    margin-left: 10px;
    width: 14px;
    height: 14px;
  }
  .fire-icon {
    margin-left: 8px;
  }
  .card-title {
    margin: 0 5px;
    font-size: 12px;
    color: var(--main-green);
  }
  p {
    margin: 0;
  }

  .offer-information {
    margin: 6px 0;
  }

  .offer-information .success-icon {
    width: 10px;
    height: 10px;
  }

  .radius10 {
    border-radius: 10px !important;
  }

  .radius6 {
    border-radius: 6px !important;
  }

  .mr10 {
    margin-right: 10px !important;
  }

  .normalcard {
    width: 220px;
    padding: 6px 10px;
    background-color: #202021;
    border: 1px solid #67C23A;
  }

  .btn-border--green {
    width: 100%;
    height: 33px;
    color: #fff;
    background-color: #161617;
    border: 1px solid #67C23A;
    font-size: 14px;
    padding: 5px 10px;
    font-weight: 400;
    margin-bottom: 5px;
  }

  .btn-border--green:hover {
    background-color: transparent;
    color: #67C23A;
  }

  .btn-fill--green {
    color: #000;
    width: 82px;
    height: 33px;
    background-color: #67C23A;
    border: 1px solid #67C23A;
    font-size: 14px;
    font-weight: 400;
    padding: 5px 10px;
  }

  .smaller-btn {
    width: 83px;
  }

  .bigger-btn {
    width: 107px;
  }

  .main-img {
    width: 200px;
    height: 229.9px;
    object-fit: cover;
  }

  .btn-fill--green:hover {
    background-color: transparent;
    color: #67C23A;
  }

  .wax-price {
    color: #f89022;
  }

  .default-price {
    color: #67C23A;
  }
}
</style>
