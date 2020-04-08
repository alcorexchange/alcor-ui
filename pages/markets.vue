<template lang="pug">
.row
  .col
    el-tabs(type="border-card" v-model="activeName")
      el-tab-pane(label="Tile" name="first")
        .p-2
          el-input(size="small" v-model="search" placeholder="Filter by token").align-self-end.ml-auto.d-none.d-lg-block

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
              .text-success {{ market.last_price | humanFloat }}

      el-tab-pane(label="List" name="second")
        el-table(:data='filteredItems', style='width: 100%' @row-click="clickOrder")
          el-table-column(label='Pair', prop='date' width="300")
            template(slot-scope="scope")
              TokenImage(:src="$tokenLogo(scope.row.token.symbol.name, scope.row.token.contract)" height="30")
              span.ml-2
                | {{ scope.row.token.symbol.name }}
                a(:href="monitorAccount(scope.row.token.contract)" target="_blank") ({{ scope.row.token.contract }})

          el-table-column(label='Last price', prop='name')
            template(slot-scope="scope")
              .text-success {{ scope.row.last_price | humanFloat }}
          el-table-column(label='24H Volume', prop='name')
            span.text-mutted Available soon
          el-table-column(label='24H Change %', prop='name')
            span.text-mutted Available soon
          el-table-column(align='right')
            template(slot='header', slot-scope='scope')
              el-input(size="small" v-model="search" placeholder="Filter by token")

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

      loading: true,
      activeName: 'first'
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
    clickOrder(a, b, event) {
      if (event.target.tagName.toLowerCase() === 'a') return

      this.$router.push({ name: 'trade-id', params: { id: a.id } })
    }
  }
}
</script>

<style>
.el-table__row {
  cursor: pointer;
}

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

.order-row {
  cursor: pointer;
}
</style>
