<template lang="pug">
.row.mt-3
  .col-2
    .row.mb-lg-3
      .col
        NewOrder(@created="fetchOrders")
    //el-menu(router default-active='2')
      el-menu-item(index='/nft-markets/all' disabled) Filter
      el-menu-item(index='/nft-markets/all' disabled) Category
  .col-lg-10
    .row.mt-2
      .col
        .items
          card.item(v-for="order in sellOrders" :order="order")

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

  mounted() {
    this.fetchOrders()
  },

  methods: {
    async fetchOrders() {
      const { rows } = await this.rpc.get_table_rows({
        code: this.network.nftMarket.contract,
        scope: this.network.nftMarket.contract,
        table: 'sellorders',
        limit: 1000
      })

      this.sellOrders = rows
    }
  }
}
</script>

<style scoped>
.items {
  display: flex;
  flex-wrap: wrap!important;
  justify-content: space-between;
}

.item {
  width: 32%;
  margin-bottom: 10px;
}

@media only screen and (max-width: 600px) {
  .item {
    width: 100%;
  }
}

</style>
