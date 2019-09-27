<template lang="pug">
// TODO App need decomposition
div
  el-tabs(type='border-card').mt-4
    el-tab-pane(label="Markets" v-loading="loading")
      .el-row
        .el-col
          .d-flex
            new-order-form(@submit="newMarket" v-if="user").mr-2 Open new market

            el-input(size="small" v-model="search" placeholder="Filter by token").ml-2.mr-4
      .el-row
        .el-col
          el-table(:data="filteredItems" @row-click="clickOrder" row-class-name="order-row")
            el-table-column(label="ID" width="70")
              template(slot-scope='scope')
                //i.el-icon-time
                nuxt-link(:to="{name: 'trade-id', params: {id: scope.row.id }}" style='margin-left: 10px') {{ scope.row.id }}

            el-table-column(label="Token")
              template(slot-scope="scope")
                .name-wrapper(slot="reference")
                  TokenImage(:src="$tokenLogo(scope.row.token.symbol, scope.row.token.contract)" height="50")
                  span.ml-2(v-if="scope.row.token.symbol == 'EOS' && scope.row.token.contract != 'eosio.token'")
                    el-tooltip(effect="dark" content='This is not "EOS" system token, be careful' placement="top")
                      el-tag(type="danger") {{ scope.row.token.quantity }}@{{ scope.row.token.contract }}

                  span.ml-2(v-else).lead {{ scope.row.token.symbol.name }}@{{ scope.row.token.contract }}

            el-table-column(label="Price (EOS)" width="200")
              template(slot-scope='scope')
                span.text-mutted {{ scope.row.price }}

            // el-table-column(label="Volume" width="200") TODO
              template(slot-scope='scope')
                span.text-mutted Soon..

    el-tab-pane(label='Rules & Information')
      h2.lead.ml-3.mt-3 With EOS Tokens you can exchange any EOS.IO tokens, for any other EOS.IO tokens,
           | atomically, without the participation of third parties! The tokens should comply with the
           | standard eosio.token of the contract.

      h4.ml-3.mt-3 Properties:
        ul.mt-1
          li.lead All the logic of order storage and exchange takes place in the contract, without any additional centralized solutions.
          li.lead The exchange works automatically, without the possibility of third parties to influence the work of the contract.
          li.lead This application works without centralized back-end and uses only the public EOS node.
          li.lead Each exchange is charged a commission of 0.25% for both tokens if the transaction amount is sufficient. Otherwise, for small amounts, no commission will be charged.

      h4.ml-3 Roadmap:
        ul.mt-1
          li.lead Global redesign of the application.
          li.lead The web application will be published in open source. And contract later.
          li.lead Development of additional services for easy search, sorting and working with orders.

      h4.ml-3 Audit:
        ul.mt-1
          li.lead Exchange contract:
            a(:href="'eostokensdex' | monitorAccount" target="_blank") wwweosswapio

          //li.lead Comission account:
            a(:href="'eosswapdivs1' | monitorAccount" target="_blank") eosswapdivs1

    el-tab-pane(label='Partners').p-3
      .lead.mb-4 Friends and partners of the project. By any collaborations you can send your suggestions to telegram chat!

      hr
      .d-flex
        a(href="https://eosnameswaps.com" target="_blank").btn
          .d-flex.align-items-center.span
            img(src="https://www.eosnameswaps.com/images/ens_logo.jpg" height="80").mr-3
            .lead A decentralized EOS account exchange.



</template>

<script>
import { captureException } from '@sentry/browser'

import { mapGetters } from 'vuex'
import NewOrderForm from '~/components/NewOrderForm.vue'
import History from '~/components/History.vue'
import TokenImage from '~/components/elements/TokenImage'
import { getSellOrders, getBuyOrders } from '~/api'

import config from '~/config'
import { transfer } from '~/store/chain.js'
import { parseExtendedAsset, sort_by_price } from '~/utils'


export default {
  components: {
    NewOrderForm,
    History,
    TokenImage
  },

  data() {
    return {
      markets: [],
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
    ...mapGetters(['user']),
    ...mapGetters('chain', ['rpc']),

    filteredItems() {
      return this.markets.filter((i) => {
        if (i.token.toString().toLowerCase().includes(this.search.toLowerCase()))
          return true

        if (i.token.toString().toLowerCase().includes(this.search.toLowerCase()))
          return true
      })
    }
  },

  async created() {
    await this.fetch()
    this.fetchMarketStatistics()
  },

  methods: {
    fetchMarketStatistics() {
      for (let market of this.markets) {
        Promise.all([getBuyOrders(market.id), getSellOrders(market.id)]).then(([buyOrders, sellOrders]) => {
          if (buyOrders.length)
            market.price = buyOrders.sort(sort_by_price)[0].unit_price
          else if (sellOrders.length)
            market.price = sellOrders.sort(sort_by_price)[sellOrders.length - 1].unit_price
          else
            return

          market.price = this.$options.filters.humanFloat(market.price) + ' EOS'
        })
      }
    },

    clickOrder(a) {
      this.$router.push({name: 'trade-id', params: { id: a.id }})
    },

    async newMarket({ buy, sell }) {
      const loading = this.$loading({
        lock: true,
        text: 'Wait for Scatter'
      })

      try {
        const r = await transfer(sell.contract, this.user.name, sell.quantity, `${buy.quantity}`)

        this.fetch()
        this.$notify({ title: 'Place order', message: r.processed.action_traces[0].inline_traces[1].console, type: 'success' })
      } catch (e) {
        captureException(e, {extra: {buy, sell}})
        this.$notify({ title: 'Place order', message: e.message, type: 'error' })
        console.log(e)
      } finally {
        loading.close()
      }
    },

    async fetch() {
      // TODO Подгрузка с прокруткой
      this.loading = true
      this.markets = []

      let upper_bound

      while (true) {
        // fetch all orders
        let rows = []
        try {
          rows = (await this.rpc.get_table_rows({
            code: config.contract,
            scope: config.contract,
            table: 'markets',
            reverse: true,

            upper_bound
          })).rows

          rows.map((r) => {
            r.token = parseExtendedAsset(r.token)
            r.price = '0.0000 EOS'
          })

          this.markets = [...this.markets, ...rows]
        } catch (e) {
          captureException(e)
          this.$notify({ title: 'Load markets', message: e.message, type: 'error' })
          break
        } finally {
          this.loading = false
        }

        if (rows.length > 1) {
          upper_bound = rows[rows.length - 1].id - 1
          if (upper_bound < 0) break
        } else {
          break
        }
      }
    }
  }
}
</script>



<style>
.order-row {
  cursor: pointer;
}
</style>
