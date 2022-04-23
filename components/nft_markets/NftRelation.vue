<template lang="pug">
.row.cards-container
  .nft-information
    .information-totalnum {{ new Intl.NumberFormat().format(data && data.total && data.total.nfts || 0) }}
    .information-period NFTs Minted Weekly
  .relation-shape
    .relation-shape_icon(
      :style='{ backgroundImage: `url(${require("~/assets/images/relation_shape1.svg")})` }'
    )
  .nft-information
    .information-totalnum {{ new Intl.NumberFormat().format(data && data.total && data.today.transactions || 0) }}
    .information-period Trades Today
  .relation-shape
    .relation-shape_icon(
      :style='{ backgroundImage: `url(${require("~/assets/images/relation_shape2.svg")})` }'
    )
  .nft-information
    .information-totalnum {{ new Intl.NumberFormat().format(Math.floor(data && data.total && data.today.sales_volume / 100000000) || 0) }}
    .information-period WAX Daily Volume
  .relation-shape
    .relation-shape_icon(
      :style='{ backgroundImage: `url(${require("~/assets/images/relation_shape3.svg")})` }'
    )
  .nft-information
    .information-totalnum {{ new Intl.NumberFormat().format(Math.floor(data && data.total && data.today.sales_volume / 100000000) * price || 0)}}
    .information-period $ Daily Volume
</template>

<style scoped lang="scss">
.relation-shape_icon {
  width: 50px;
  height: 50px;
  background-size: 100% 100%;
}
.cards-container {
  justify-content: space-between;
  padding: 15px 50px;
  background-color: #202021;
  border-radius: 20px;
  align-items: center;
  width: calc(100% - 10px);
  margin: 0;
}
.nft-information {
  text-align: center;
}
.information-totalnum {
  font-weight: bold;
  font-size: 20px;
}
.information-period {
  font-weight: 500;
  font-size: 16px;
  color: var(--cancel);
}
</style>

<script>
import { mapState } from 'vuex'

export default {
  props: ['data', 'price'],
  data() {
    return {
      search: '',

      sellOrders: [],
    }
  },
}
</script>
