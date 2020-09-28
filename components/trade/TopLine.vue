<template lang="pug">
.box-card.px-2.pt-2
  .row
    .col
      .d-flex.align-items-center(v-if="!isMobile")
        TokenImage(:src="$tokenLogo(token.symbol.name, token.contract)" height="30").ml-1

        .d-flex.ml-2
          b {{ token.symbol.name }}
          a(:href="monitorAccount(token.contract )" target="_blank").text-muted.ml-2 {{ token.contract }}

        .d-flex.ml-3(v-if="hasWithdraw")
          // TODO Token prop & mobile version
          Withdraw(:token="{contract: token.contract, symbol: token.symbol.name, precision: token.symbol.precision}")

        .d-flex.ml-3(v-if="$store.state.ibcTokens.includes(token.contract)")
          // TODO Token prop & mobile version
          BOSIbc(:token="{contract: token.contract, symbol: token.symbol.name, precision: token.symbol.precision}")

        //.d-flex.ml-3.w-100.justify-content-around.desctop
        .d-flex.align-items-center.ml-4.small
          span Change 24H:
          change-percent(:change="stats.change24").ml-2

          span.ml-3 Volume 24H:
          span.text-success.ml-2  {{ stats.volume24.toFixed(2) }} {{ network.baseToken.symbol }}

          //span Volume 7 Day:
          //  span.text-success.ml-1  {{ stats.volumeWeek | humanFloat(network.baseToken.precision, 2) }} {{ network.baseToken.symbol }}

          //span Change 7 Day:
          //  change-percent(:change="stats.changeWeek").ml-2
          //.d-flex.ml-2(v-if="!isMobile")
          //  span Volume 7 Day:
          //  span.text-success.ml-1  {{ stats.volumeWeek | humanFloat(network.baseToken.precision, 2) }} {{ network.baseToken.symbol }}

          //.d-flex.ml-2(v-if="!isMobile")
          //  span Change 7 Day:
          //  change-percent(:change="stats.changeWeek").d-flex.ml-2
      div(v-else)
        .overflowbox
          .row.align-items-center
            .col-2
              TokenImage(:src="$tokenLogo(token.symbol.name, token.contract)" height="30").ml-2
            .col-10
              .d-flex.ml-2
                b {{ token.symbol.name }}@
                a(:href="monitorAccount(token.contract )" target="_blank") {{ token.contract }}
          .row
            .col
              .d-flex.ml-2
                span Change 24H:
                change-percent(:change="stats.change24").ml-2
          .row
            .col
              .d-flex.ml-2
                span Volume 24H:
                span.text-success.ml-1  {{ stats.volume24.toFixed(2) }} {{ network.baseToken.symbol }}
          .row
            .col.ml-3
              Withdraw(:token="{contract: token.contract, symbol: token.symbol.name, precision: token.symbol.precision}" v-if="hasWithdraw")
              BOSIbc(:token="{contract: token.contract, symbol: token.symbol.name, precision: token.symbol.precision}" v-if="token.contract == 'bosibc.io'")

</template>

<script>
import { mapState } from 'vuex'
import TokenImage from '~/components/elements/TokenImage'
import ChangePercent from '~/components/trade/ChangePercent'
import Withdraw from '~/components/withdraw/Withdraw'
import BOSIbc from '~/components/withdraw/BOSIbc'

export default {
  components: {
    TokenImage,
    ChangePercent,
    Withdraw,
    BOSIbc
  },

  computed: {
    ...mapState(['network']),
    ...mapState('market', ['token', 'stats']),

    hasWithdraw() {
      return Object.keys(this.network.withdraw).includes(this.token.str)
    }
  }
}
</script>

<style lang="scss">
.desctop span {
  font-size: 10px;
  padding-right: 10px;
}
</style>
