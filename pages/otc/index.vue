<template lang="pug">
.row
  .col
    .row.mt-2
      .col
        el-tabs(type='border-card')
          el-tab-pane(label="Orders" v-loading="loading")
            //.row.mb-3(v-if="$store.state.network.name == 'eos'")
              .col
                el-alert(title="The OTC contract was changed(updated)!" type="warning")
                  span Old orders can be found and canceled(recommended) here:
                    a(href="https://eosswap.io" target="_blank")  EOSSWAP

            .row
              .col
                .d-flex
                  new-order-form.mr-2 Create new order

                  el-select(v-model="search" clearable placeholder="Select token" size="medium").ml-2.mr-2.w-25
                    el-option(
                      v-for="token in tokens"
                      :key="token"
                      :label="token"
                      :value="token"
                    )
                      TokenImage(:src="$tokenLogo(token.split('@')[0], token.split('@')[1])" height="25").mr-2
                      span  {{ token }}

                  el-input(size="medium" v-model="search" placeholder="Filter by token").ml-2.mr-3.w-75
            .row
              .col
                el-table(:data="filteredItems" @row-click="clickOrder" row-class-name="order-row")
                  el-table-column(label="ID" width="70")
                    template(slot-scope='scope')
                      //i.el-icon-time
                      nuxt-link(:to="{name: 'otc-order-id', params: {id: scope.row.id }}" style='margin-left: 10px') {{ scope.row.id }}

                  el-table-column(label="Owner" width="130")
                    template(slot-scope="scope")
                      .name-wrapper(slot="reference")
                        el-tag(size="medium") {{ scope.row.maker }}

                  el-table-column(label="Sell" sortable :sort-method="sortBySell")
                    template(slot-scope="scope")
                      TokenImage(:src="$tokenLogo(scope.row.sell.quantity.split(' ')[1], scope.row.sell.contract)" height="25")
                      span.ml-2(v-if="scope.row.sell.symbol == 'EOS' && scope.row.sell.contract != 'eosio.token'")
                        el-tooltip(effect="dark" content='This is not "EOS" system token, be careful' placement="top")
                          el-tag(type="danger") {{ scope.row.sell.quantity }}@{{ scope.row.sell.contract }}

                      span.ml-2(v-else) {{ scope.row.sell.quantity }}@{{ scope.row.sell.contract }}

                  el-table-column(label="Buy" sortable :sort-method="sortByBuy")
                    template(slot-scope="scope")
                      TokenImage(:src="$tokenLogo(scope.row.buy.symbol, scope.row.buy.contract)" height="25")
                      //span.ml-2(v-if="symbol == 'EOS'") {{ scope.row.buy.quantity }}@{{ scope.row.buy.contract }}
                      span.ml-2(v-if="scope.row.buy.symbol == 'EOS' && scope.row.buy.contract != 'eosio.token'")
                        el-tooltip(effect="dark" content="Top Center prompts info" placement="top")
                          el-tag(type="danger") {{ scope.row.buy.quantity }}@{{ scope.row.buy.contract }}

                      span.ml-2(v-else) {{ scope.row.buy.quantity }}@{{ scope.row.buy.contract }}

                  el-table-column(label="Price" width="250" sortable :sort-method="sortByPrice")
                    template(slot-scope="scope")
                      b.ml-2 {{ scope.row.price }}

          el-tab-pane(label='History')
            history

          el-tab-pane(label='Rules & Information')
            h2.lead.ml-3.mt-3 With TOKENSWAP you can exchange any EOS.IO tokens, for any other EOS.IO tokens,
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
                  a(:href="monitorAccount(contract)" target="_blank")  {{ contract }}

                li.lead Comission account:
                  a(:href="monitorAccount(divContract)" target="_blank")  {{ divContract }}

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
import { mapState, mapGetters, mapActions } from 'vuex'

import NewOrderForm from '~/components/otc/NewOrderForm.vue'
import History from '~/components/otc/History.vue'

import TokenImage from '~/components/elements/TokenImage'

export default {
  components: {
    NewOrderForm,
    History,
    TokenImage
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
    ...mapGetters(['user']),
    ...mapState('otc', ['orders']),
    ...mapState({
      contract: state => state.network.otc.contract,
      divContract: state => state.network.otc.divs
    }),

    tokens() {
      const tokens = []

      this.orders.map(order => {
        if (!tokens.includes(order.sell.str)) tokens.push(order.sell.str)
        if (!tokens.includes(order.buy.str)) tokens.push(order.buy.str)
      })

      return tokens
    },

    filteredItems() {
      return this.orders.filter(i => {
        if (i.buy.str.toLowerCase().includes(this.search.toLowerCase()))
          return true

        if (i.sell.str.toLowerCase().includes(this.search.toLowerCase()))
          return true
      })
    }
  },

  mounted() {
    this.fetch()
  },

  methods: {
    ...mapActions('chain', ['tranfer', 'fetchOrders']),
    ...mapActions('otc', ['fetchOrders']),

    sortByPrice(a, b) {
      const ap = parseFloat(a.price.split(' ')[0])
      const bp = parseFloat(b.price.split(' ')[0])

      if (ap > bp) return 1
      if (ap < bp) return -1
      return 0
    },

    sortByBuy(a, b) {
      if (a.buy.amount > b.buy.amount) return 1
      if (a.buy.amount < b.buy.amount) return -1
      return 0
    },

    sortBySell(a, b) {
      if (a.sell.amount > b.sell.amount) return 1
      if (a.sell.amount < b.sell.amount) return -1
      return 0
    },

    clickOrder(a) {
      this.$router.push({ name: 'otc-order-id', params: { id: a.id } })
    },

    async buy({ id, buy }) {
      if (!this.user) return this.$notify({ title: 'Authorization', message: 'Pleace login first', type: 'info' })

      const loading = this.$loading({
        lock: true,
        text: 'Wait for Scatter'
      })

      try {
        await this.tranfer({
          contract: buy.contract,
          actor: this.user.name,
          quantity: buy.quantity,
          memo: `fill|${id}`
        })

        this.$notify({ title: 'Success', message: `You fill ${id} order`, type: 'success' })
        this.fetch()
      } catch (e) {
        captureException(e, { extra: { buy, id } })
        this.$notify({ title: 'Place order', message: e.message, type: 'error' })
        console.log(e)
      } finally {
        loading.close()
      }
    },

    async fetch() {
      // TODO Подгрузка с прокруткой
      this.$store.commit('otc/setOrders', [])
      this.loading = true

      try {
        await this.fetchOrders()
      } catch (e) {
        captureException(e)
        this.$notify({ title: 'Load orders', message: e.message, type: 'error' })
      } finally {
        this.loading = false
      }
    }
  },

  head() {
    return {
      title: 'Alcor OTC Exchange | Trustless tokens swaps',

      meta: [
        { hid: 'description', name: 'description', content: 'Atomic exchange of any token amount for any other token.' }
      ]
    }
  }
}
</script>

<style scoped>
.order-row {
  cursor: pointer;
}

.select-token {
  width: 200px;
}
</style>
