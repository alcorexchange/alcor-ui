<template lang="pug">
.box-card
  .grid-card(v-if="!isMobile")
    TokenImage(:src="$tokenLogo(quote_token.symbol.name, quote_token.contract)" height="30")
    .d-flex.title-token
      p
        <b>{{ quote_token.symbol.name }}</b>
      a(
        :href="monitorAccount(quote_token.contract )"
        target="_blank"
        class="text-muted"
      ) {{ quote_token.contract }}
      p / {{ base_token.symbol.name }}

    .d-flex(v-if="hasWithdraw")
      // TODO Token prop & mobile version
      Withdraw(:token="{contract: quote_token.contract, symbol: quote_token.symbol.name, precision: quote_token.symbol.precision}")

    //.d-flex.ml-3(v-if="$store.state.ibcTokens.includes(quote_token.contract)")
      // TODO Token prop & mobile version
      BOSIbc(:token="{contract: quote_token.contract, symbol: quote_token.symbol.name, precision: quote_token.symbol.precision}")

    //.d-flex.ml-3.w-100.justify-content-around.desctop
    .d-flex.align-items-center.small.change
      span Change 24H:
      change-percent(:change="stats.change24")

      span Volume 24H:
      span.text-success {{ stats.volume24.toFixed(2) }} {{ base_token.symbol.name }}
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
    Withdraw
    //BOSIbc
  },

  computed: {
    ...mapState(['network']),
    ...mapState('market', ['stats', 'base_token', 'quote_token']),

    hasWithdraw() {
      return Object.keys(this.network.withdraw).includes(this.quote_token.str)
    }
  }
}
</script>

<style lang="scss">
.grid-card {
  display: grid;
  grid-template-columns: 35px auto 1fr;
  grid-gap: 1rem;
  align-items: center;
  padding: .5rem 1rem;
  .title-token, .change {
    column-gap: .5rem;
  }
  .title-token {
    p {
      margin: 0;
    }
  }
}
@media screen and (min-width: 1001px) and (max-width: 1200px) {
  .grid-card {
    grid-template-columns: 35px 1fr;
    grid-gap: .2rem .5rem;
    img {
      grid-row: 1/3;
    }
    .title-token {
      grid-row: 1;
    }
  }
}
@media screen and (max-width: 1000px) {
  .box-card {
    margin: 10px 5px;
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
