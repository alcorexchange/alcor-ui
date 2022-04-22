<template lang="pug">
.normalcard.radius10.tradeoffercard
  header.d-flex.justify-content-between.mb-2
    div
      img(src='~/assets/images/small_shape.svg' style="width:21px;height:21px")
      span.card-title {{data.maker}}
    div
      img(src='~/assets/images/double_arrow.svg' alt='')
      img.card-title-img(src='~/assets/images/fire.svg' alt='')
      span.card-number {{data.id}}
  .main-img.radius10(v-if='imageBackground' :style='imageBackground')
  .main-img.radius10(v-else='' :style='defaultBackground')
  .d-flex.justify-content-between.align-items-end.mt-2.mb-2
    p.token-info--title Sword
    p.token-group Almemes
  .btn-group.justify-content-between.pb-2(v-if="!this.data.nobtngroup")
    button.btn-border--green.mr10.radius6 Details
    button.btn-fill--green.radius6 Add
</template>

<script>
import { mapState } from 'vuex'
import defaultImg from '~/assets/images/default.png'

export default {
  props: ['data', 'price', 'kindBut'],

  data() {
    return {
      search: '',
      defaultBackground: {
        backgroundSize: 'cover',
        backgroundImage: 'url(' + defaultImg + ')',
      },
      sellOrders: [],
    }
  },
  computed: {
    imageBackground() {
      return false
    }
  },
  methods: {
    debug() {
      console.log('this.data', this.data.buy.quantity.replaceAll('WAX', ''))
    },
  },
}
</script>

<style lang="scss">
.tradeoffercard {
  padding: 11px 13px;
  .card-title {
    color: #66C167;
    padding-left: 5px;
  }
  .card-title-img {
    margin: 0 8px;
  }
  .card-number {
    background: #212121;
    border-radius: 8px;
    padding: 2px 6px;
  }
  .token-info--title {
    color: #66C167;
    font-size: 18px;
  }
  .token-group {
    font-size: 12px;
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
    height: 100%;
    padding: 6px 10px;
    background-color: #202021;
  }

  .btn-border--green {
    width: 108px;
    height: 33px;
    color: #fff;
    background-color: #161617;
    border: 1px solid #67C23A;
    font-size: 14px;
    padding: 5px 10px;
    font-weight: 400;
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
    width: 194px;
    height: 223px;
    object-fit: cover;
    margin: auto;
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
