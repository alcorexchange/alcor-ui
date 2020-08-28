<template lang="pug">
.row
  .col
    el-card
      .row
        .col-lg-2.mb-2
          .d-flex.align-items-center.h-100
            nuxt-link(to="new_market")
              //.new-market-btn
              el-button(tag="el-button" type="primary" size="big" icon="el-icon-plus") Open new market
        .col-lg-7
          .d-flex.align-items-center.h-100
            el-checkbox(v-model="ibcTokens") IBC Tokens (Cross-Chain)
        .col-lg-3
          .d-flex.align-items-center.h-100
            el-input(v-model="search" placeholder="Search token")
      .row
        .col
          el-table(:data='filteredItems',
          style='width: 100%' @row-click="clickOrder" :default-sort="{prop: 'weekVolume', order: 'descending'}")
            el-table-column(label='Pair', prop='date' width="250")
              template(slot-scope="scope")
                TokenImage(:src="$tokenLogo(scope.row.token.symbol.name, scope.row.token.contract)" height="30")
                span.ml-2
                  | {{ scope.row.token.symbol.name }}
                  a(:href="monitorAccount(scope.row.token.contract)" target="_blank") ({{ scope.row.token.contract }})

            el-table-column(
              :label="`Last price`"
              sort-by="last_price"
              width="180"
              align="right"
              header-align="right"
              sortable
              :sort-orders="['descending', null]"
            )
              template(slot-scope="scope")
                .text-success {{ scope.row.last_price | humanPrice }} {{ network.baseToken.symbol }}
            el-table-column(
              :label='`24H Volume`'
              align="right"
              header-align="right"
              sortable
              sort-by="volume24"
              :sort-orders="['descending', null]"
            )
              template(slot-scope="scope")
                span.text-mutted {{ scope.row.volume24 | humanFloat(network.baseToken.precision, 2) }} {{ network.baseToken.symbol }}
            el-table-column(
              label='24H Change %'
              prop='name'
              align="right"
              header-align="right"
              sortable
              sort-by="change24"
              :sort-orders="['descending', null]"
            )
              template(slot-scope="scope" align="right" header-align="right")
                change-percent(:change="scope.row.change24")

            el-table-column(
              label='7 Day Volume'
              prop='weekVolume'
              align="right"
              header-align="right"
              sortable
              sort-by="volumeWeek"
              :sort-orders="['descending', null]"
            )
              template(slot-scope="scope")
                span.text-mutted {{ scope.row.volumeWeek | humanFloat(network.baseToken.precision, 2) }} {{ network.baseToken.symbol }}

            el-table-column(
              label='7 Day Change %'
              prop='weekChange'
              align="right"
              header-align="right"
              sortable
              sort-by="changeWeek"
              :sort-orders="['descending', null]"
            )
              template(slot-scope="scope")
                change-percent(:change="scope.row.changeWeek")

</template>

<script>
import { captureException } from '@sentry/browser'

import { mapGetters, mapState } from 'vuex'
import TokenImage from '~/components/elements/TokenImage'
import ChangePercent from '~/components/trade/ChangePercent'

export default {
  components: {
    TokenImage,
    ChangePercent
  },

  async fetch({ store, error }) {
    if (store.state.markets.length == 0) {
      try {
        await store.dispatch('loadMarkets')
      } catch (e) {
        captureException(e)
        return error({ message: e, statusCode: 500 })
      }
    }
  },

  data() {
    return {
      search: '',

      to_assets: [],
      ibcTokens: false,

      select: {
        from: '',
        to: ''
      },

      loading: true
    }
  },

  computed: {
    ...mapState(['network']),
    ...mapGetters(['user']),
    ...mapGetters('chain', ['rpc']),
    ...mapState(['markets']),

    filteredItems() {
      if (!this.markets) return []

      return this.markets.filter((i) => {
        if (i.token.str.toLowerCase().includes(this.search.toLowerCase())) {
          if (this.ibcTokens) {
            return this.$store.state.ibcTokens.includes(i.token.contract) ||
              Object.keys(this.network.withdraw).includes(i.token.str)
          }

          return true
        }
      }).reverse()
    },

    activeTab: {
      get () {
        return this.$store.state.market.activeTab
      },

      set (value) {
        this.$store.commit('market/setActiveTab', value)
      }
    }

  },
  methods: {
    clickOrder(a, b, event) {
      if (event && event.target.tagName.toLowerCase() === 'a') return

      this.$router.push({ name: 'markets-id', params: { id: this.marketSlug(a) } })
    },

    marketSlug(market) {
      return market.token.str.replace('@', '-')
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

.market {
  color:inherit;
  text-decoration: none;

  display: block;
  font-size: 87.5%;
  color: #212529;
}

.market:hover {
  cursor: pointer;
  font-weight: bold;
  font-size: 14px;
  color:inherit;
  text-decoration: none;
}

.market:hover img {
  height: 35px;
}

.order-row {
  cursor: pointer;
}
</style>
