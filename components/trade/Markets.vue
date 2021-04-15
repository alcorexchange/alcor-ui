<template lang="pug">
.markets-bar
  .pt-2.px-2
    el-input(size="small" v-model="search" placeholder="Filter by token" clearable)
  el-table(:data="filteredItems" style="width: 100%" @row-click="setMarket" :default-sort='{ prop: "volume24", order: "descending" }' :row-class-name="activeRowClassName" height="465" width="100%" v-loading="loading")
    el-table-column(label="Pair" width="120")
      template(slot-scope="scope")
        TokenImage(:src="$tokenLogo(scope.row.quote_token.symbol.name, scope.row.quote_token.contract)" height="20")
        small.ml-1 {{ scope.row.quote_token.symbol.name }}
        small.ml-1  / {{ scope.row.base_token.symbol.name }}

    el-table-column(prop="last_price" label="Price" align="right" sortable :sort-orders="['descending', null]")
      template(slot-scope="scope")
        .text-success {{ scope.row.last_price }}

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

    filteredItems() {
      if (!this.markets) return []
      return this.markets.filter((i) => {
        if (i.slug.toLowerCase().includes(this.search.toLowerCase()))
          return true
      }).reverse()
    }
  },

  mounted() {
    console.log('mounted markets...')
  },

  methods: {
    setMarket(market) {
      //this.loading = true
      this.$router.push(
        { name: 'trade-index-id', params: { id: market.slug } },
        () => this.loading = false,
        () => this.loading = false
      )
    },

    activeRowClassName({ row }) {
      if (row.id == this.id) {
        return 'active-row'
      }
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
