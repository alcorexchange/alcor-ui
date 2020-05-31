<template lang="pug">
  el-card(shadow="hover" @click.native="open").market-item
    div(slot='header')
      .d-flex
        b {{ price.amount | humanFloat(price.symbol.precision()) }} {{ price.symbol.code().to_string() }}
        //.badge.el-button--primary.text-wrap.ml-auto {{ order.sell.length }} NFT's pack
        .badge.el-button--primary.text-wrap.ml-auto(v-if="order.sell.length > 1") {{ order.sell.length }} NFT's pack
    .row
      .col
        .market-items
          .p-1(v-for="nft in order.sell").pointer.mb-1
            .row
              .col-lg-3
                .p-1
                  img(:src="nft.mdata.img" height=70)
              .col-lg-9
                .d-flex.flex-column
                  span {{ nft.mdata.name }}
                  b ID: {{ nft.id }}
                  span Category: {{ nft.category }}
                  span Author
                    b.ml-1 {{ nft.author }}
            hr.m-0

        //el-button().w-100 Show
</template>

<script>
import { asset } from 'eos-common'
import { mapState } from 'vuex'

export default {
  props: ['order'],

  computed: {
    ...mapState(['network']),

    price() {
      const q = asset(this.order.buy.quantity)
      return q
    }
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

.market-item .badge {
  line-height: inherit;
}

.market-items {
  max-width: 100%;
  overflow-x: hidden;

  max-height: 200px;
  overflow-y: auto;
}
</style>
