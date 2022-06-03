<template lang="pug">
el-table.my-funds(:data='balances' row-class-name='pointer' @row-click='rowClick')
  el-table-column(:label="'Token (' + balances.length + ')'" width=100)
    template(slot-scope='{ row }')
      span {{ row.currency }}
  el-table-column(:label='$t("Total Amount")' width=200)
    template(slot-scope='{ row }')
      .d-flex
        span.amount {{ row.amount | commaFloat(4) }}
        span.green.ml-auto (${{ row.usd_value | commaFloat }})
</template>

<script>
import { mapState } from 'vuex'

export default {
  props: ['onlyCurrentPair'],

  computed: {
    ...mapState(['network', 'user']),
    ...mapState('market', ['base_token', 'quote_token']),

    balances() {
      if (!this.user) return []
      if (!this.user.balances) return []

      return this.user.balances
        .filter((b) => {
          if (this.onlyCurrentPair) {
            if (b.contract == this.base_token.contract || b.contract == this.quote_token.contract) return true

            return false
          }

          return true
        })
        .sort((a, b) => {
          if (a.contract == this.network.baseToken.contract) return -1

          if (a.usd_value > b.usd_value) return -1
          if (a.usd_value < b.usd_value) return 1

          return 0
        })
    }
  },

  methods: {
    rowClick(token) {
      this.$router.push({
        name: 'markets', query: { tab: 'all', search: `${token.currency}-${token.contract}` }
      })
    }
  }
}
</script>

<style lang="scss">
.market-row div {
  font-size: 13px;
}

.my-funds {
  table {
    width: 100% !important;
  }
}
</style>
