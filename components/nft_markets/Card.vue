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
          el-carousel(indicator-position="outside" :arrow="order.sell.length > 1 ? 'hover' : 'never'")
            el-carousel-item(v-for="nft in order.sell" :key="nft.id")
              .p-3.text-center(v-if="nft.mdata")
                b {{ nft.mdata.name }}
                img(:src="nft.mdata.img" width="80%" @error="setOriginalSrc")
          //.p-3(v-for="nft in order.sell").pointer.mb-1
            .row
              .col
                b.text-muted.mb-1 {{ nft.mdata.name }}
                img(:src="nft.mdata.img" width="100%")
            .row
              .col
                .d-flex.flex-column
                  b ID: {{ nft.id }}
                  span Category: {{ nft.category }}
                  span Author
                    b.ml-1 {{ nft.author }}
            .row
              .col
                span lol

            //.row
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
    },

    setOriginalSrc(event) {
      if (event.target.src.includes('https://images.hive.blog/0x0/')) {
        event.target.src = event.target.src.replace('https://images.hive.blog/0x0/', '')
      }
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
  max-height: 400px;
  cursor: pointer;
}

.market-item .badge {
  line-height: inherit;
}

.market-items {
  max-width: 100%;
  overflow-x: hidden;

  max-height: 340px;
  overflow-y: auto;
}
</style>
