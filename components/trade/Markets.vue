<template lang="pug">
.markets-bar(v-loading="loading")
  .pt-2.px-2
    el-input(size="small" v-model="search" placeholder="Filter by token")
  el-table(:data="filteredItems" style="width: 100%" @row-click="setMarket" :row-class-name="activeRowClassName" height="650")
    el-table-column(label="Token" width="90")
      template(slot-scope="scope")
        TokenImage(:src="$tokenLogo(scope.row.token.symbol.name, scope.row.token.contract)" height="20")
        small.ml-1 {{ scope.row.token.symbol.name }}

    el-table-column(prop="last_price" label="Price" width="90" align="right")
      template(slot-scope="scope")
        .text-success {{ scope.row.last_price | humanPrice }}

    el-table-column(prop="volume24" label="Volume 24H" width="120" align="right")
      template(slot-scope="scope")
        .pr-2
          | {{ scope.row.volume24 | humanFloat(network.baseToken.precision, 2) }} {{ network.baseToken.symbol }}


</template>

<script>
import { mapState } from 'vuex'
import TokenImage from '~/components/elements/TokenImage'

export default {
  components: {
    TokenImage
  },

  data() {
    return {
      search: '',
      loading: true
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

  async mounted() {
    if (this.markets.length == 0) {
      await this.$store.dispatch('loadMarkets')
    }

    this.loading = false
  },

  methods: {
    setMarket(market) {
      const loading = this.$loading({
        lock: true
      })

      this.$router.push(
        { name: 'markets-id', params: { id: `${market.token.symbol.name}-${market.token.contract}` } },
        () => loading.close(),
        () => loading.close()
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

<style>
.markets-bar .el-table .active-row {
  background: #c2deff;
}

.markets-bar .el-table .cell {
  font-size: 12px;
  padding-right: 0px;
}
</style>
