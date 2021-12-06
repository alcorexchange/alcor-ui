<template lang="pug">
.box-card.pl-2.pt-2
  .row
    .col
      .d-flex.align-items-center(v-if="!isMobile").desktop
        TokenImage(:src="$tokenLogo(quote_token.symbol.name, quote_token.contract)" height="30").ml-1

        .d-flex.ml-2.symbol
          b {{ quote_token.symbol.name }}
          a(:href="monitorAccount(quote_token.contract )" target="_blank").text-muted.ml-2 {{ quote_token.contract }}
          span.ml-1 /  {{ base_token.symbol.name }}

        //.d-flex.ml-3(v-if="hasWithdraw")
          // TODO Token prop & mobile version
          Withdraw(:token="{contract: quote_token.contract, symbol: quote_token.symbol.name, precision: quote_token.symbol.precision}")

        //.d-flex.ml-3(v-if="$store.state.ibcTokens.includes(quote_token.contract)")
          // TODO Token prop & mobile version
          BOSIbc(:token="{contract: quote_token.contract, symbol: quote_token.symbol.name, precision: quote_token.symbol.precision}")

        //.d-flex.ml-3.w-100.justify-content-around.desctop
        .d-flex.align-items-center.ml-3.small.text-muted
          span Change 24H:
          change-percent(:change="stats.change24").ml-2

          span.ml-2 Volume 24H:
          span.text-success.ml-2  {{ stats.volume24.toFixed(2) }} {{ base_token.symbol.name }}
          .pointer.ml-2
            i(:class="{ 'el-icon-star-on': isFavorite }" @click="toggleFav").el-icon-star-off
            //i.el-icon-star-off.ml-2
      div(v-else)
        .overflowbox.items
          .row.align-items-center(v-if="base_token.symbol.name == network.baseToken.symbol && base_token.contract == network.baseToken.contract")
            .col-2
              TokenImage(:src="$tokenLogo(quote_token.symbol.name, quote_token.contract)" height="30").ml-2
            .col-10
              .d-flex.ml-2
                b {{ quote_token.symbol.name }}@
                a(:href="monitorAccount(quote_token.contract )" target="_blank") {{ quote_token.contract }}

          .row.align-items-center(v-else)
            .col-2
              TokenImage(:src="$tokenLogo(base_token.symbol.name, base_token.contract)" height="30").ml-2
            .col-10
              .d-flex.ml-2
                b {{ base_token.symbol.name }}@
                a(:href="monitorAccount(base_token.contract )" target="_blank") {{ base_token.contract }}
          .row
            .col
              .d-flex.ml-2
                span Change 24H:
                change-percent(:change="stats.change24").ml-2
          .row
            .col
              .d-flex.ml-2
                span Volume 24H:
                span.text-success.ml-1  {{ stats.volume24.toFixed(2) }} {{ base_token.symbol.name }}
          .row
            .col.ml-3
              Withdraw(:token="{contract: quote_token.contract, symbol: quote_token.symbol.name, precision: quote_token.symbol.precision}" v-if="hasWithdraw")
              //BOSIbc(:token="{contract: quote_token.contract, symbol: quote_token.symbol.name, precision: quote_token.symbol.precision}" v-if="quote_token.contract == 'bosibc.io'")

</template>

<script>
import { mapState } from 'vuex'
import TokenImage from '~/components/elements/TokenImage'
import ChangePercent from '~/components/trade/ChangePercent'
import Withdraw from '~/components/withdraw/Withdraw'
//import BOSIbc from '~/components/withdraw/BOSIbc'

export default {
  components: {
    TokenImage,
    ChangePercent,
    Withdraw,
    //BOSIbc
  },

  computed: {
    ...mapState(['network']),
    ...mapState('market', ['stats', 'base_token', 'quote_token', 'id']),
    ...mapState('settings', ['favMarkets']),

    hasWithdraw() {
      return Object.keys(this.network.withdraw).includes(this.quote_token.str)
    },

    isFavorite() {
      return this.favMarkets.includes(this.id)
    }
  },

  methods: {
    toggleFav() {
      if (this.isFavorite) {
        this.$store.commit('settings/setFavMarkets', this.favMarkets.filter(m => m != this.id))
      } else {
        this.$store.commit('settings/setFavMarkets', this.favMarkets.concat([this.id]))
      }
    }
  }
}
</script>

<style scoped lang="scss">
.desktop {
  font-size: 14px;

  i {
    font-size: 17px;
  }
}

.desctop span {
  font-size: 10px;
  padding-right: 10px;
}
.items {
  > * {
    padding: 2px;
  }
}
</style>
