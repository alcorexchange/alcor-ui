<template lang="pug">
.normalcard.radius10
  header.d-flex.justify-content-between.mb-1
    div
      img(src='~/assets/images/small_shape.svg')
      span.card-title {{ data.seller }}
    div
      img(src='~/assets/images/double_arrow.svg', alt='')
      img(src='~/assets/images/fire.svg', alt='')
      span.card_number # {{ new Intl.NumberFormat().format(data.assets[0].template_mint) || 0 }}
  //- .main-img.radius10(v-if='imageBackground', :style='imageBackground')
  .main-img.radius10(:style='defaultBackground')
  .offer-information
    .d-flex.justify-content-between
      p
        | Alcorex
        img.success-icon(src='~/assets/images/check_circle.svg', alt='')
      p(
        v-if='kindBut === "sales" || kindBut === "auctions" || kindBut === "all"'
      ) price
    .d-flex.justify-content-between
      p.wax-name {{  data.assets[0].name || &apos;None&apos;  }}
      p.wax-price(
        v-if='kindBut === "sales" || kindBut === "auctions" || kindBut === "all"'
      )
        | {{ new Intl.NumberFormat().format(data.price.amount / (10 * data.price.token_precision)) }}WAX
    .d-flex.justify-content-between
      p Default
      p.default-price(
        v-if='kindBut === "sales" || kindBut === "auctions" || kindBut === "all"'
      )
        | (${{ new Intl.NumberFormat().format((data.price.amount / (10 * data.price.token_precision)) * price) }})
  .btn-group.justify-content-between
    button.btn-border--green.mr10.radius6(v-if='kindBut == "sales"') Details
    button.btn-fill--green.radius6(v-if='kindBut == "sales"') Buy
    button.btn-border--green.mr10.radius6.smaller-btn(
      v-if='kindBut != "sales"'
    ) Details
    button.btn-fill--green.bigger-btn.radius6(v-if='kindBut == "auctions"') Make Offer
    button.btn-fill--green.bigger-btn.radius6(
      v-if='kindBut != "sales" && kindBut != "auctions"'
    ) Send Offer
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
        backgroundImage: 'url(' + defaultImg + ')'
      },
      sellOrders: []
    }
  },
  computed: {
    imageBackground() {
      if (this.data.sell[0].mdata)
        return {
          backgroundSize: 'cover',
          backgroundImage: 'url(' + this.data.assets[0].mdata.img + ')'
        }
      else return false
    }
  },
  methods: {
    debug() {
      console.log('this.data', this.data.buy.quantity.replaceAll('WAX', ''))
    }
  }
}
</script>

<style lang="scss">
p {
  margin: 0;
}

header {
  white-space: nowrap;
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

.wax-name {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
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
