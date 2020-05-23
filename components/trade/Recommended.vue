<template lang="pug">
.row
  .col
    .row.mb-2
      .col
        .badge.badge-primary.text-wrap Recommended tokens
    .row
      .col-lg-2.col-md-4.col-sm-6(:key="market.id" v-for="market in markets").mb-2
        .small
          nuxt-link(:to="{ name: 'markets-id', params: { id: marketSlug(market) } }")
            el-card(shadow="hover")
              TokenImage(:src="$tokenLogo(market.token.symbol.name, market.token.contract)" height="30")
              span.ml-2
                span {{ market.token.symbol.name }}
                .text-success {{ market.last_price | humanPrice }}

              ChangePercent(:change="market.changeWeek")

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
