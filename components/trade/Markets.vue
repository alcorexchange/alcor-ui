<template lang="pug">
.markets-bar
  .pt-2.px-2
    el-input(size="small" v-model="search" placeholder="Filter by token")
  el-table(:data="filteredItems" style="width: 100%" @row-click="setMarket" :row-class-name="activeRowClassName" height="465" width="100%" v-loading="loading")
    el-table-column(label="Pair")
      template(slot-scope="scope")
        TokenImage(:src="$tokenLogo(scope.row.token.symbol.name, scope.row.token.contract)" height="20")
        small.ml-1 {{ scope.row.token.symbol.name }}

    el-table-column(prop="last_price" label="Price" align="right" sortable :sort-orders="['descending', null]" width="100")
      template(slot-scope="scope")
        .text-success {{ scope.row.last_price | humanPrice }}

    el-table-column(prop="change" label="Change" align="right" sortable :sort-orders="['descending', null]" width="100")
      template(slot-scope="scope")
        change-percent(:change="scope.row.change24")
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
    ...mapState('market', ['id']),

    filteredItems() {
      if (!this.markets) return []
      return this.markets.filter((i) => {
        if (i.token.str.toLowerCase().includes(this.search.toLowerCase()))
          return true
      }).reverse()
    }
  },

  mounted() {
    console.log('mounted markets...')
  },

  //async mounted() {
  //  if (this.markets.length == 0) {
  //    await this.$store.dispatch('loadMarkets')
  //  }

  //  this.loading = false
  //},

  methods: {
    setMarket(market) {
      //const loading = this.$loading({
      //  lock: true
      //})

      this.loading = true
      this.$router.push(
        { name: 'markets-id', params: { id: `${market.token.symbol.name}-${market.token.contract}` } },
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
.markets-bar {
  height: 500px;
}

.markets-bar .el-table .active-row {
  background: var(--active-row);
}
</style>
