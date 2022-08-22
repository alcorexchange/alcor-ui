<template lang="pug">
.detailWithCardPanel.mt-5.d-flex.justify-content-between
  .nft-info.border-radius5.d-flex.flex-column.justify-content-between
    .d-flex
      .other-info
        .nft
          label.description-title Sale ID
          h4 {{ "#" + saleID }}
        .nft
          label.description-fee Seller
          p {{ data.seller }}
        .nft
          label.description-fee Price
          p.wax-price {{ price + " WAX" }}
            span.wax-exchange.ml-1 (${{ $systemToUSD(price) }})
        .nft
          label.description-fee Date
          p {{ +data.assets[0].transferred_at_time | moment("MM/DD/YYYY HH:mm a") }}
      .description-info
        .nft
          label.description-title Mint Number
          p {{ data.assets[0].template_mint }} of {{ data.assets[0].template.issued_supply }} (max: {{ data.assets[0].template.max_supply }}) -
            span.color-red.ml-1 {{ data.assets[0].template.issued_supply - data.assets[0].template_mint }}
            img(src='~/assets/images/fire.svg')
        .nft
          label.description-title Template ID
          p.wax-exchange {{ "#" + data.assets[0].template.template_id }}
        .nft
          p.description-title.mb-0 Propertise
          div
          div(v-if='data.assets[0].template.is_transferable')
            img(src='~/assets/images/double_arrow.svg')
            span.ml-2.fs-18 Transferable
          div(v-if='data.assets[0].template.is_burnable')
            img(src='~/assets/images/fire.svg')
            span.ml-2.fs-18 Burnable
  NormalCard(:data='data', :mode='mode')
</template>

<script>
import NormalCard from '~/components/nft_markets/NormalCard'

export default {
  components: { NormalCard },
  props: ['data', 'mode'],
  computed: {
    saleID() {
      if (this.data.auction_id) {
        return this.data.auction_id
      } else return this.data.sale_id
    },
    price() {
      if (this.data.price) {
        return (
          this.data.price.amount / Math.pow(10, this.data.price.token_precision)
        )
      } else return 0
    },
  },
}
</script>

<style lang="scss" scoped>
.nft-info {
  width: 595px;
  background-color: #202021;
  padding: 14px;
}
.border-radius5 {
  border-radius: 5px;
}
.other-info {
  width: 40%;
  h4 {
    font-size: 20px;
  }
}

.wax-price {
  color: #f89022;
}
.nft {
  width: auto;
  height: auto;
}
.wax-exchange {
  font-weight: 500;
  font-size: 16px;
  color: #34fb24;
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
.color-red {
  color: #ff4949;
  margin-right: 5px;
}
</style>
