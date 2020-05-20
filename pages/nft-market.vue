<template lang="pug">
.row.mt-3
  .col-2
    //el-menu.el-menu-vertical-demo(default-active='2', @open='handleOpen', @close='handleClose')
    el-menu(router default-active='2')
      el-menu-item(index='/nft-markets/all') All
      el-menu-item(index='1-2') Sell
  .col-8
    .row
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

export default {
  components: {
    Card
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
