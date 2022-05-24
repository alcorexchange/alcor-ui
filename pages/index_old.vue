<template lang="pug">
// TODO App need decomposition
.row
  .col
    .row.mt-3
      .col-lg-6
        h1.display-4 The first self-listing decentralized exchange

        .lead
          a(:href="monitorAccount($store.state.network.contract)" target="_blank").text-primary.strong  FULLY-ONCHAIN
          |  limit/market trading.

        .lead.mt-1 No withdraw or deposit.

        b No trading fees.

        p
          span  Immediately open the market for your token or any token you want.
          |  Forget about the listing request form, waiting, third-party dependency, and any regulations.
          //span  Create markets in one click, list your dapp token for one click, trade whatever you want.
        .row
          .col-auto.pr-0.py-1
            nuxt-link(to="markets")
              el-button(tag="el-button" type="primary" size="big") Trade now
          .col.py-1.mb-2
            nuxt-link(to="new_market")
              el-button(tag="el-button" size="big" icon="el-icon-circle-plus-outline" plain) Open new market

      .col-lg-6
        el-carousel(indicator-position='outside' height="350px" :interval="6000" arrow="never")
          el-carousel-item
            .text-center
              .text-muted New video guide from
                a(href="https://twitter.com/LigerLite" target="_blank")  @LiteLiger
                |  is here!
            a(href="https://www.youtube.com/watch?v=myFL-sPCi90&feature=youtu.be" target="_blank")
              img(src="~/assets/images/video2.png").video-image

          el-carousel-item
            a(href="https://youtu.be/nNneIVv0yyQ" target="_blank")
              img(v-if="$colorMode.value == 'light'" src="~/assets/images/market_window_white.png").video-image
              img(v-else src="~/assets/images/market_window_black.png").video-image

          //el-carousel-item
            el-card.h-100
              .lead Place for your ad.
              small Telegram:
              a(@click="openInNewTab('https://t.me/avral')").pointer  @avral

    hr.my-2

    Recommended(:markets="recomendedMarkets")

    hr.mt-3

    // TODO Format partners!
    //.display-4.mt-4 Partners
    //p.lead.mb-4 Friends and partners of the project. By any collaborations you can send your suggestions to
      a(href="https://t.me/alcorexchange" target="_blank")  telegram chat!

    //.row.px-4
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

    .display-4.mt-4 About

    .row.mt-3
      .col
        .row.mt-2
          .col
            .lead With Alcor you can trade any EOS.IO tokens for system EOS tokens,
                 | atomically, without the participation of third parties! The tokens should comply with the
                 | standard eosio.token of the contract.

        .row
          .col
            .mt-3
              .lead Properties:
                ul.mt-1
                  li.lead Fully
                    a(:href="monitorAccount($store.state.network.contract)" target="_blank")  onchain
                    |  matching for limit/market trades.
                  li.lead All the logic of order storage and matching takes place in the contract's ram, without any additional centralized solutions.
                  li.lead This application works without centralized back-end and uses only the public EOS node and public api serivices.
                  li.lead
                    b No commission at all
                    |  for beta testing time.
        .row.mt-3
          .col
            .lead FAQ
            el-collapse
              el-collapse-item(title='How to add icon for my token ?', name='1')
                p.lead You can add token, options:

                ul
                  li.lead Add icon to Eos token collection
                    a(href="https://github.com/BlockABC/eos-tokens" target="_blank")  https://github.com/BlockABC/eos-tokens
                  li.lead All icon on alcor
                    a(href="https://github.com/avral/alcor-ui/tree/master/assets/tokens" target="_blank")  github page folder
                    |  name format: symbol-contract.png
                  li.lead If you cant do any of that,
                    a(href="https://t.me/avral" target="_blank")  send me .png to dm.

              el-collapse-item(title='Audit? How it works?', name='2')
                .lead Exchange contract:
                  a(:href="monitorAccount($store.state.network.contract)" target="_blank") {{ $store.state.network.contract }}

        .row.mb-3
          .col
            .display-4.mt-4 Technologies:

        .row.px-4
          .col-md-4
            a(href="https://github.com/eosrio/Hyperion-History-API" target="_blank").img
              img(src="~/assets/logos/hyperion.png")
            .lead Hyperion by
              a(href="https://eosrio.io/")  EOSRio
            span
              br
              | The nice tool to get all actions history.
              br
              | All trading graphs and deals history provided by hyperion.
          .col-md-4
            a(href="https://github.com/cc32d9/eosio_light_api" target="_blank").img
              img(src="~/assets/logos/lightapi.png" height=80)
            .lead EOSIO Light API
            span.mt-2
              | The nice tool to get token balances for users.
              br
              | Hosted by
              a(href="https://eosamsterdam.net/" target="_blank")  EOS Amsterdam.
          .col-md-4
            a(href="https://bloks.io" target="_blank").img
              img(src="~/assets/logos/bloks_logomark.svg" height=80)
            .lead Bloks.io
            span.mt-2
              | Is very useful eosio chains explorer.
              br
              | It uses for show all deals history and token contracts.

</template>

<script>
import Recommended from '~/components/trade/Recommended'

export default {
  components: {
    Recommended
  },

  async fetch({ store }) {
    if (store.state.markets.length == 0) {
      try {
        await store.dispatch('loadMarkets')
      } catch (e) {
        console.log('err load markets: ', e)
      }
    }
  },

  computed: {
    recomendedMarkets() {
      try {
        return this.$store.state.markets.filter(m => {
          return this.$store.state.network.RECOMMENDED_MARKETS.includes(m.quote_token.str)
          // || this.$store.state.network.RECOMMENDED_MARKETS.includes(m.base_token.str)
        })
      } catch (e) {
        console.log(e, 'Error getting markets in recomendations!!!')
        return []
      }
    }
  },

  head() {
    const chain = this.$store.state.network.name.toUpperCase()
    return {
      title: `Alcor Exchange | (${chain}) Self-Listing DEX`
    }
  }
}
</script>

<style scoped>
.github {
  position: absolute;
  right: 10px;
}

.display-4 {
  font-size: 2.5rem;
}

.video-image {
  display: block;
  width: 100%;
}

@media only screen and (min-width: 600px) {
  .video-image {
    width: 80%;
    margin: auto;
    margin-top: 30px;
  }
}
</style>
