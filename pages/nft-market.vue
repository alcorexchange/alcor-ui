<template lang="pug">
.row.mt-3
  .col-2
    //el-menu.el-menu-vertical-demo(default-active='2', @open='handleOpen', @close='handleClose')
    .row.mb-3
      .col
        NewOrder
    el-menu(router default-active='2')
      //li.el-menu-item

      //el-menu-item(index='/nft-markets/all' disabled) Buy NFT's
      el-menu-item(index='/nft-markets/all' disabled) Filter
      el-menu-item(index='/nft-markets/all' disabled) Category
      //el-menu-item(index='1-2') Sell
  .col-8
    //.row
      .col
        h1 NFT Market
    .row.mt-2
      .col
        .d-flex
          card(v-for="order in sellOrders" :order="order").mr-2

</template>

<script>
import { mapState, mapGetters } from 'vuex'
import Card from '~/components/nft_markets/Card'
import NewOrder from '~/components/nft_markets/NewOrder'

export default {
  components: {
    Card,
    NewOrder
  },

  data() {
    return {
      sellOrders: []
    }
  },

  computed: {
    ...mapState(['network']),
    ...mapGetters('api', ['rpc'])
  },

  async mounted() {
    const { rows } = await this.rpc.get_table_rows({
      code: this.network.nftMarket.contract,
      scope: this.network.nftMarket.contract,
      table: 'sellorders',
      limit: 1000
    })

    this.sellOrders = rows
  }
}
</script>
