<template lang="pug">
// TODO App need decomposition
.row
  .col
    .row
      .col-md-8
        .display-4.mt-3 Markets:
      .col-md-4.d-flex
        el-input(v-model="search" placeholder="Filter by token").align-self-end.ml-auto.d-none.d-lg-block

    #markets.d-flex.mt-4
      .market-new
        nuxt-link(to="new_market")
          //.new-market-btn
          el-button(tag="el-button" type="primary" size="big" icon="el-icon-plus") Open new market

      pre.market(v-for="market in filteredItems" @click="clickOrder(market)")
        span
        TokenImage(:src="$tokenLogo(market.token.symbol.name, market.token.contract)" height="30")
        span.ml-2
          | {{ market.token.symbol.name }}@{{ market.token.contract }}
          .text-success {{ market.price | humanFloat }}


    .display-4 Rules:
    .ml-3.mt-3
      h2.lead With EOS Tokens you can trade any EOS.IO tokens for system EOS tokens,
           | atomically, without the participation of third parties! The tokens should comply with the
           | standard eosio.token of the contract.

      h4 Properties:
        ul.mt-1
          li.lead Fully onchain matching for limit/market trades.
          li.lead All the logic of order storage and matching takes place in the contract's ram, without any additional centralized solutions.
          //li.lead The exchange works automatically, without the possibility of third parties to influence the work of the contract.
          li.lead This application works without centralized back-end and uses only the public EOS node.
          li.lead
            b No commission at all
            |  for beta testing time.
          //li.lead Each exchange is charged a commission of 0.25% for both tokens if the transaction amount is sufficient. Otherwise, for small amounts, no commission will be charged.

    h4.ml-3 Roadmap:
      ul.mt-1
        li.lead Global redesign of the application.
        li.lead The web application will be published in open source. And contract later.
        li.lead Development of additional services for easy search, sorting and working with orders.

    h4.ml-3 Audit:
      ul.mt-1
        li.lead Exchange contract:
          a(:href="'eostokensdex' | monitorAccount" target="_blank") eostokensdex

        //li.lead Comission account:
          a(:href="'eosswapdivs1' | monitorAccount" target="_blank") eosswapdivs1

    .display-4 Partners
    .ml-3.mt-3
      p.lead.mb-4 Friends and partners of the project. By any collaborations you can send your suggestions to telegram
        a(href="https://t.me/eostokensdex" target="_blank")  chat!


      hr
      .d-flex
        a(href="https://eosnameswaps.com" target="_blank").btn
          .d-flex.align-items-center.span
            img(src="https://www.eosnameswaps.com/images/ens_logo.jpg" height="80").mr-3
            .lead A decentralized EOS account exchange.

      hr
      .d-flex.align-items-center.span
        .lead The design of the original app logo:
          a(href="https://yusaymon.portfoliobox.net" target="_blank")  @yusaymon
</template>

<script>
import { captureException } from '@sentry/browser'

import { mapGetters, mapState } from 'vuex'
import TokenImage from '~/components/elements/TokenImage'

export default {
  components: {
    TokenImage
  },

  async fetch({ store, error }) {
    try {
      await store.dispatch('loadMarkets')
    } catch (e) {
      captureException(e)
      return error({ message: e, statusCode: 500 })
    }
  },

  data() {
    return {
      search: '',

      to_assets: [],

      select: {
        from: '',
        to: ''
      },

      loading: true
    }
  },

  computed: {
    ...mapGetters(['user', 'markets']),
    ...mapGetters('chain', ['rpc']),
    ...mapState({
      markets: state => state.markets
    }),

    filteredItems() {
      return this.markets.filter((i) => {
        if (i.token.str.toLowerCase().includes(this.search.toLowerCase()))
          return true
      }).reverse()
    }
  },
  methods: {
    clickOrder(a) {
      this.$router.push({ name: 'trade-id', params: { id: a.id } })
    },
  }
}
</script>

<style scoped>
.search-input {
  width: 100px;
}

#markets {
  margin-top: 10px;
  flex-wrap: wrap;
}

.new-market {
  width: 260px;
  padding: 16px;
}


.market, .market-new {
  width: 260px;
  padding: 0px 10px;
  height: 75px;
}

.market:hover {
  cursor: pointer;
  font-weight: bold;
  font-size: 14px;
}

.market:hover img {
  height: 35px;
}

.display-4 {
  font-size: 2.5rem;
}

.order-row {
  cursor: pointer;
}

</style>
