<template lang="pug">
.markets-bar
  el-tabs(v-model='sideMaretsTab' size="mini")
    el-tab-pane(name='fav')
      span(slot="label")
        i.el-icon-star-on
        |  Fav
    el-tab-pane(label='All' name='all')
    el-tab-pane(:label='network.baseToken.symbol' :name='network.baseToken.symbol')
    el-tab-pane(label='Wrapped' name='wrapped')

  .px-2
    el-input(size="small" v-model="search" placeholder="Filter by token" clearable)
  el-table(:data="filteredItems" style="width: 100%" @row-click="setMarket" :default-sort='{ prop: "volume24", order: "descending" }' :row-class-name="activeRowClassName" height="465" width="100%" v-loading="loading")
    el-table-column(label="Pair" width="120")
      template(slot-scope="scope")
        TokenImage(:src="$tokenLogo(scope.row.quote_token.symbol.name, scope.row.quote_token.contract)" height="20")
        small.ml-1 {{ scope.row.quote_token.symbol.name }}
        small.ml-1  / {{ scope.row.base_token.symbol.name }}

    el-table-column(prop="last_price" label="Price" align="right" sortable :sort-orders="['descending', null]")
      template(slot-scope="scope")
        .text-success {{ scope.row.last_price | commaFloat(5) }}

    el-table-column(prop="volume24" :sort-orders="['descending', 'ascending']" label="Vol 24H" align="right" sortable width="100")
      template(slot-scope='scope')
        span.text-mutted {{ scope.row.volume24.toFixed(2) }} {{ scope.row.base_token.symbol.name }}
</template>

<script>
import { mapState } from 'vuex'
import TokenImage from '~/components/elements/TokenImage'
import ChangePercent from '~/components/trade/ChangePercent'

export default {
  scrollToTop: false,

  components: {
    TokenImage,
    ChangePercent
  },

  data() {
    return {
      search: '',
      loading: false
    }
  },

  computed: {
    ...mapState(['markets', 'network']),
    ...mapState('market', ['id', 'quote_token']),
    ...mapState('settings', ['favMarkets']),

    sideMaretsTab: {
      get() {
        return this.$store.state.settings.sideMaretsTab
      },

      set(value) {
        this.$store.commit('settings/setSideMaretsTab', value)
      }
    },

    filteredItems() {
      if (!this.markets) return []

      let markets = []
      if (this.sideMaretsTab == 'all') {
        markets = this.markets
      } else if (this.sideMaretsTab == this.network.baseToken.symbol) {
        markets = this.markets.filter(
          (i) => i.base_token.contract == this.network.baseToken.contract
        )
      } else if (this.sideMaretsTab == 'USDT') {
        markets = this.markets.filter(
          (i) => i.base_token.contract == 'tethertether'
        )
      } else if (this.sideMaretsTab == 'fav') {
        markets = this.markets.filter(
          (i) => this.favMarkets.includes(i.id)
        )
      } else {
        const ibcTokens = this.$store.state.ibcTokens.filter(
          (i) => i != this.network.baseToken.contract
        )

        markets = this.markets.filter((i) => {
          return (
            ibcTokens.includes(i.base_token.contract) ||
            ibcTokens.includes(i.quote_token.contract) ||
            Object.keys(this.network.withdraw).includes(i.quote_token.str) ||
            Object.keys(this.network.withdraw).includes(i.base_token.str)
          )
        })
      }

      markets = markets.filter((i) =>
        i.slug.includes(this.search.toLowerCase())
      )

      return markets.reverse()
    }
  },

  methods: {
    setMarket(market) {
      if (this.id) {
        this.$store.dispatch('market/unsubscribe', this.id)
      }

      this.$router.push(
        { name: 'trade-index-id', params: { id: market.slug } },
        () => this.loading = false,
        () => this.loading = false
      )
    },

    activeRowClassName({ row }) {
      let c = 'pointer'
      if (row.id == this.id) {
        c += ' active-row'
      }

      return c
    }
  }
}

</script>

<style lang="scss">

.theme-dark {
  .markets-bar .el-table {
    th, tr {
      background: var(--background-color-base);
    }

    .el-table__row {
      &:hover {
        & td,
        & th,
        & tr {
          background: var(--btn-active) !important;
        }
      }
    }

    .active-row {
      & td,
      & th,
      & tr {
        background: var(--btn-active) !important;
      }
    }

  }
}

.markets-bar .el-table .active-row {
  background: #e6eef1;
}

.markets-bar {
  height: 500px;
}

</style>
