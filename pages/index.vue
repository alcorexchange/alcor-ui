<template lang="pug">
// TODO App need decomposition
.row
  .col
    .jumbotron.mt-2
      h1.display-4 The first self-listing decentralized exchange

      .lead
        a(:href="monitorAccount($store.state.network.contract)" target="_blank").text-primary.strong  FULLY-ONCHAIN
        |  limit/market trading.

      h2.lead.mt-1 No withdraw or deposit.

      p.lead
        span
          b No trading fee.
      p
        span  Immediately open the market for your token or any token you want.
        |  Forget about the listing request form, waiting, third-party dependency, and any regulations.
        //span  Create markets in one click, list your dapp token for one click, trade whatever you want.
      .row
        .col-auto.pr-0.py-1
          nuxt-link(to="markets")
            el-button(tag="el-button" type="primary" size="big") Trade now
        .col.py-1
          nuxt-link(to="new_market")
            el-button(tag="el-button" size="big" icon="el-icon-circle-plus-outline" plain) Open new market

      hr.my-2

      Recommended(:markets="recomendedMarkets")

      hr.mt-3

      .display-4.mt-4 Partners
      p.lead.mb-4 Friends and partners of the project. By any collaborations you can send your suggestions to
        a(href="https://t.me/alcorexchange" target="_blank")  telegram chat!

      .row.px-4
        //.col-md-4.p-2
          a(href="https://zenblocks.io" target="_blank")
            img(src="~/assets/logos/zenblocks.png" height=70)

          .lead UI/UX recomendations

        .col-md-4.p-2
          a(href="https://eosnameswaps.com" target="_blank")
            img(src="https://www.eosnameswaps.com/images/ens_logo.jpg" height=70)
          .lead A decentralized EOS account exchange.

        .col-md-4.p-2
          a(href="https://mywish.io/eos-token" target="_blank")
            img(src="~/assets/logos/mywish.svg" height=61)
          .lead.mt-2 Create your own EOS token.

        .col-md-4.p-2
          a(href="https://coffe.io" target="_blank")
            img(src="~/assets/logos/coffe.svg" height=70)

          .lead First integrated eosio chain.

        .col-md-4.p-2
          a(href="https://yusaymon.portfoliobox.net" target="_blank")
            el-avatar(:size="70" src="https://empty")
              img(src="~/assets/logos/yusaymon.jpeg")

          a(href="https://yusaymon.portfoliobox.net" target="_blank")
          .lead The design of the original app logo: @yusaymon
</template>

<script>
import Recommended from '~/components/trade/Recommended'

export default {
  components: {
    Recommended
  },

  async fetch({ store, error }) {
    if (store.state.markets.length == 0) {
      try {
        await store.dispatch('loadMarkets')
      } catch (e) {
      }
    }
  },

  computed: {
    recomendedMarkets() {
      try {
        return this.$store.state.markets.filter(m => this.$store.state.network.RECOMMENDED_MARKETS.includes(m.token.str))
      } catch (e) {
        console.log(e, 'Error getting markets in recomendations!!!')
        return []
      }
    }
  }
}
</script>

<style scoped>
.display-4 {
  font-size: 2.5rem;
}

.jumbotron {
  padding: 2rem 2rem;
  background-color: #fafafa;
  margin-bottom: 0px;
}
</style>
