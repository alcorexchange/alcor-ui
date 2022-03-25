<template lang="pug">
.normalcard.radius10
  header.d-flex.justify-content-between.mb-1
    div
      img(src='~/assets/images/small_shape.svg')
      span.card-title {{data.maker}}
    div
      img(src='~/assets/images/double_arrow.svg' alt='')
      img(src='~/assets/images/fire.svg' alt='')
      span.card_number # {{data.id}}
  .main-img.radius10(v-if='imageBackground' :style='imageBackground')
  .main-img.radius10(v-else='' :style='defaultBackground')
  .offer-information
    .d-flex.justify-content-between
      p
        | Alcorex
        img.success-icon(src='~/assets/images/check_circle.svg' alt='')
      p(v-if="kindBut === 'sales' || kindBut === 'auctions' || kindBut === 'all' ") price
    .d-flex.justify-content-between
      p {{data.sell[0].owner || &apos;None&apos;}}
      p.wax-price(v-if="kindBut === 'sales' || kindBut === 'auctions' || kindBut === 'all' ")
        | {{data.buy.quantity.replaceAll(&apos;WAX&apos;,&apos;&apos;) * 1}}WAX
    .d-flex.justify-content-between
      p Default
      p.default-price(v-if="kindBut === 'sales' || kindBut === 'auctions' || kindBut === 'all' ")
        | (${{defaultPrice}})
  .btn-group.justify-content-between
    button.btn-border--green.mr10.radius6(v-if="kindBut == 'sales'") Details
    button.btn-fill--green.radius6(v-if="kindBut == 'sales'") Buy
    button.btn-border--green.mr10.radius6.smaller-btn(v-if="kindBut != 'sales'") Details
    button.btn-fill--green.bigger-btn.radius6(v-if="kindBut == 'auctions'") Make Offer
    button.btn-fill--green.bigger-btn.radius6(v-if="kindBut != 'sales' && kindBut != 'auctions'") Send Offer
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
      defaultPrice: new Intl.NumberFormat().format(
        this.data.buy.quantity.replaceAll('WAX', '') * this.price
      ),
    }
  },
  computed: {
    imageBackground() {
      if (this.data.sell[0].mdata)
        return {
          backgroundSize: 'cover',
          backgroundImage: 'url(' + this.data.sell[0].mdata.img + ')',
        }
      else return false
    },
  },
  methods: {
    debug() {
      console.log('this.data', this.data.buy.quantity.replaceAll('WAX', ''))
    },
  },
}
</script>

<style lang="scss">
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
}

.btn-border--green {
  width: 108px;
  height: 33px;
  color: #fff;
  background-color: #161617;
  border: 1px solid var(--main-green);
  font-size: 14px;
  padding: 5px 10px;
  font-weight: 400;
}

.btn-border--green:hover {
  background-color: transparent;
  color: var(--main-green);
}

.btn-fill--green {
  color: #000;
  width: 82px;
  height: 33px;
  background-color: var(--main-green);
  border: 1px solid var(--main-green);
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
  color: var(--main-green);
}

.wax-price {
  color: #f89022;
}

.default-price {
  color: var(--main-green);
}

@media only screen and (max-width: 600px) {
  .market-cards .item {
    width: 100%;
  }
}
</style>
