<template lang="pug">
.row.markets.mt-4
  .col
    el-card
      .row
        .col-lg-2.mb-2
          .d-flex.align-items-center.h-100
            nuxt-link(to="new_market")
              el-button(tag="el-button" size="small" icon="el-icon-plus") Open new market
        .col-lg-7
          el-radio-group(
            v-if="!isMobile"
            v-model="base_token"
            size="small").radio-chain-select

            el-radio-button(label="all")
              span All

            el-radio-button(:label="network.baseToken.symbol")
              span {{ network.baseToken.symbol }}

            el-radio-button(v-if="network.name == 'eos'" label="USDT")
              span USDT

            el-radio-button(value='cross-chain' label="Cross-Chain")
              span Cross-Chain
        .col-lg-3
          .d-flex.align-items-center.h-100
            el-input(v-model="search" placeholder="Search token" size="small")
      .row
        .col
          el-table(:data='filteredMarkets',
          style='width: 100%' @row-click="clickOrder" :default-sort="{prop: 'weekVolume', order: 'descending'}")
            el-table-column(label='Pair', prop='date' width="300")
              template(slot-scope="scope")
                TokenImage(:src="$tokenLogo(scope.row.quote_token.symbol.name, scope.row.quote_token.contract)" height="30")

                span.ml-2
                  | {{ scope.row.quote_token.symbol.name }}
                  a(:href="monitorAccount(scope.row.quote_token.contract)" target="_blank").text-muted.ml-2 {{ scope.row.quote_token.contract }}
                  |  /  {{ scope.row.base_token.symbol.name }}

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
                .text-success {{ scope.row.last_price }} {{ scope.row.base_token.symbol.name }}
            el-table-column(
              :label='`24H Volume`'
              align="right"
              header-align="right"
              sortable
              sort-by="volume24"
              :sort-orders="['descending', null]"
            )
              template(slot-scope="scope")
                span.text-mutted {{ scope.row.volume24.toFixed(2) }} {{ scope.row.base_token.symbol.name }}

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
                span.text-mutted {{ scope.row.volumeWeek.toFixed(2) }} {{ scope.row.base_token.symbol.name }}

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
      base_token: 'all',

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

    filteredMarkets() {
      if (!this.markets) return []

      let markets = []
      if (this.base_token == 'all') {
        markets = this.markets
      } else if (this.base_token == this.network.baseToken.symbol) {
        markets = this.markets.filter(i => i.base_token.contract == this.network.baseToken.contract)
      } else if (this.base_token == 'USDT') {
        markets = this.markets.filter(i => i.base_token.contract == 'tethertether')
      } else {
        const ibcTokens = this.$store.state.ibcTokens.filter(i => i != this.network.baseToken.contract)

        markets = this.markets.filter(i => {
          return (ibcTokens.includes(i.base_token.contract) ||
              ibcTokens.includes(i.quote_token.contract) ||
              Object.keys(this.network.withdraw).includes(i.quote_token.str) ||
              Object.keys(this.network.withdraw).includes(i.base_token.str))
        })
      }

      markets = markets.filter(i => i.slug.includes(this.search.toLowerCase()))

      return markets.reverse()
    }
  },
  methods: {
    clickOrder(a, b, event) {
      if (event && event.target.tagName.toLowerCase() === 'a') return

      this.$router.push({ name: 'trade-index-id', params: { id: a.slug } })
    }
  }
}
</script>

<style>
.theme-dark {
  .markets {
    .el-card__body {
      padding: 0px;
    }
  }
}

.markets {
  .el-table__row {
    cursor: pointer;
  }
}
</style>
