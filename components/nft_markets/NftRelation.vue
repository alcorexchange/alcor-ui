<template lang="pug">
.row.cards-container
  .nft-information
    .information-totalnum 17,891
    .information-period NFTs Minted Weekly
  .relation-shape
    div.relation-shape_icon(:style="{ backgroundImage:`url(${require('~/assets/images/relation_shape1.svg')})`}")
  .nft-information
    .information-totalnum 90,129
    .information-period Trades Today
  .relation-shape
    div.relation-shape_icon(:style="{ backgroundImage:`url(${require('~/assets/images/relation_shape2.svg')})`}")
  .nft-information
    .information-totalnum 1,112,786
    .information-period WAX Daily Volume
  .relation-shape
    div.relation-shape_icon(:style="{ backgroundImage:`url(${require('~/assets/images/relation_shape3.svg')})`}")
  .nft-information
    .information-totalnum 689,238
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

  data() {
    return {
      search: '',

      sellOrders: []
    }
  },
}
</script>
