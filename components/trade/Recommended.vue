<template lang="pug">
.row
  .col
    .row.mb-2
      .col
        .badge.text-wrap Recommended tokens
    .row
      .col-lg-2.col-md-4.col-sm-6(:key="market.id" v-for="market in markets").mb-2
        .small
          nuxt-link(:to="{ name: 'trade-index-id', params: { id: market.slug } }")
            el-card(shadow="hover")
              TokenImage(:src="$tokenLogo(market.quote_token.symbol.name, market.quote_token.contract)" height="30")
              span.ml-2
                span {{ market.quote_token.symbol.name }}
                .text-success {{ market.last_price | humanPrice }}

              ChangePercent(:change="market.changeWeek")

      .col-lg-2.col-md-4.col-sm-6
        el-button(@click="openInNewTab('https://t.me/avral')" type="text" icon="el-icon-circle-plus-outline") Token promotion

</template>

<script>
import TokenImage from '~/components/elements/TokenImage'
import ChangePercent from '~/components/trade/ChangePercent'

export default {
  components: {
    TokenImage,
    ChangePercent
  },

  props: {
    markets: {
      type: Array,
      default: () => []
    }
  },
}
</script>

<style scoped>
a {
  text-decoration: none;
}

.item {
  cursor: pointer;
  margin-right: .5%;
  width: 17%;
  padding: 20px 8px 20px 10px;
  background: #fff;
}


</style>
