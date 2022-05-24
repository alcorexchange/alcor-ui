<template lang="pug">
.row.recommended
  .col
    .row.mb-2
      .col
        .badge.text-wrap Recommended tokens
    .row
      .col-lg-2.col-md-4.col-sm-6(:key="market.id" v-for="market in markets").mb-2
        .small
          nuxt-link(:to="{ name: 'trade-index-id', params: { id: market.slug } }")
            el-card(shadow="hover")
              .row
                .col
                  TokenImage(:src="$tokenLogo(market.quote_token.symbol.name, market.quote_token.contract)" height="25")
                  span.ml-2 {{ market.symbol }}

              .row.mt-1
                .col
                  span {{ market.last_price }}
                  ChangePercent(:change="market.changeWeek").float-right

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
  }
}
</script>

<style lang="scss">
.recommended {
  .el-card__body {
      padding: 10px;
  }

  a {
    text-decoration: none;
  }
}

</style>
