<template lang="pug">
  el-card(v-loading="loading" shadow="hover" @click.native="open").market-item
    div(slot='header')
      .badge.badge-primary.text-wrap {{ order.sell.length }} NFT's pack
    .row
      .col
        .market-items
          .p-1(v-for="nft in nfts").pointer.mb-1
            .row
              .col-lg-3
                .p-1
                  img(:src="nft.mdata.img" height=50)
              .col-lg-9
                .d-flex.flex-column
                  .lead {{ nft.idata.name }}
                  b ID: {{ nft.id }}
                  span Category: {{ nft.category }}
                  span Author
                    b.ml-1 {{ nft.author }}

        //el-button().w-100 Show
</template>

<script>
import { mapState, mapGetters } from 'vuex'

export default {
  props: ['order'],

  data() {
    return {
      nfts: [],

      loading: true
    }
  },

  computed: {
    ...mapState(['network']),
    ...mapGetters('api', ['rpc'])
  },

  async mounted() {
    const nfts = []

    for (const id of this.order.sell) {
      const { rows: [item] } = await this.rpc.get_table_rows({
        code: 'simpleassets',
        scope: this.network.nftMarket.contract,
        table: 'sassets',
        lower_bound: id,
        limit: 1
      })

      item.mdata = JSON.parse(item.mdata)
      item.idata = JSON.parse(item.idata)

      nfts.push(item)
    }

    this.nfts = nfts
    this.loading = false
  },

  methods: {
    open() {
      this.$router.push({ name: 'nft-market-order-id', params: { id: this.order.id } })
    }
  }
}
</script>

<style>
.market-item .el-card__header {
  padding: 10px 20px;
}

.market-item .el-card__body {
  padding: 0px;
}

.items-count {
  position: absolute;
  top: 0;
  right: 0;
}

.market-item {
  max-height: 300px;
  cursor: pointer;
}

.market-items {
  max-width: 100%;
  overflow-x: hidden;

  max-height: 200px;
  overflow-y: auto;
}
</style>
