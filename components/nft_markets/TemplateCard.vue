<template lang="pug">
.schemacard
  .normalcard.radius10
    header.d-flex.justify-content-between.mb-1
      div
        img(
          :style='{ width: "21px", height: "21px" }',
          src='~/assets/images/small_shape.svg'
        )
        span.card-title(v-if='mode === "template"') {{ mode === "template" ? cardData.collection.author : "" }}
      div
        img(src='~/assets/images/double_arrow.svg', alt='')
        img.fire-icon(src='~/assets/images/fire.svg', alt='')
    .main-img.radius10(:style='imageBackground || defaultBackground')
    .offer-information
      .d-flex.justify-content-between.align-items-end
        p {{  mode === 'template' ? (cardData.immutable_data.name ? cardData.immutable_data.name : "No Name") : ''  }}
        p {{ mode === "template" ? cardData.contract : "" }}
      .d-flex.justify-content-between.creator-item
        .d-flex
          p Creator:
          p {{ mode === "template" ? cardData.collection.author : "" }}
        p(v-if='mode === "template"') {{ cardData.max_supply }} NFTs
      .nft-checkbox-item.d-flex.align-items-center(v-if='mode === "template" && cardData.is_transferable')
        p NFTs can be Transferred
        .form-group_image(
          :style='{ backgroundImage: `url(${require("~/assets/images/fire.svg")})` }'
        )
      .nft-checkbox-item.d-flex.align-items-center(v-if='mode === "template" && cardData.is_burnable')
        p NFTs can be Burned
        .form-group_image(
          :style='{ backgroundImage: `url(${require("~/assets/images/double_arrow.svg")})` }'
        )
    button.btn-border--green.radius6 Detail
</template>

<script>
import { mapState } from 'vuex'
import defaultImg from '~/assets/images/default.png'

export default {
  props: ['cardData', 'mode'],
  data() {
    return {
      defaultBackground: {
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundImage: 'url(' + defaultImg + ')',
      },
    }
  },
  computed: {
    imageBackground() {
      if (this.mode === 'template') {
        if (this.cardData.immutable_data.image) {
          return {
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundImage: this.cardData.immutable_data.image.includes(
              'https://'
            )
              ? this.cardData.immutable_data.image
              : 'url(https://ipfs.io/ipfs/' +
                this.cardData.immutable_data.image +
                ')',
          }
        } else return false
      } else return false
    },
  },
}
</script>

<style lang="scss">
.schemacard {
  .nft-checkbox-item {
    color: var(--cancel);
  }
  .offer-information > div:first-child > p:first-child {
    font-size: 20px;
    color: var(--main-green);
  }
  .creator-item {
    font-size: 13px;
    div > p:first-child {
      color: #9f979a;
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
    border: 1px solid #67c23a;
  }

  .btn-border--green {
    width: 100%;
    height: 33px;
    color: #fff;
    background-color: #161617;
    border: 1px solid #67c23a;
    font-size: 14px;
    padding: 5px 10px;
    font-weight: 400;
    margin-bottom: 5px;
  }

  .btn-border--green:hover {
    background-color: transparent;
    color: #67c23a;
  }

  .btn-fill--green {
    color: #000;
    width: 82px;
    height: 33px;
    background-color: #67c23a;
    border: 1px solid #67c23a;
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
    color: #67c23a;
  }

  .wax-price {
    color: #f89022;
  }

  .default-price {
    color: #67c23a;
  }
}
</style>
