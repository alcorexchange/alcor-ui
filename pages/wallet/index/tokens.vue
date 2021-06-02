<template lang="pug">
  el-card
    el-table(:data="balances", style='width: 100%' v-if="user" @cell-click="cellClick")
      el-table-column(label='Asset' width="300")
        template(slot-scope="scope")
          TokenImage(:src="$tokenLogo(scope.row.currency, scope.row.contract)" height="25")
          span.ml-2 {{ scope.row.currency }}
          a(:href="monitorAccount(scope.row.contract)" target="_blank").text-muted.ml-2 {{ scope.row.contract }}
          el-tag(v-if="hasMarket(scope.row)" size="small").float-right Trade

      el-table-column(label='Amount' align="right" width="150" :sort-method="sortByAmount"
      sortable :sort-orders="['descending', null]")
        template(slot-scope="scope")
          | {{ scope.row.amount }}

      el-table-column(label='Transfer' width="150")
        template(slot-scope='scope')
          TokenTransfer(:token="scope.row")

      el-table-column(label="Manage" align='right')
        template(slot='header', slot-scope='scope')
          el-input(v-model='search', size='small', placeholder='Type to search').w-50
        template(slot-scope='scope')
          //Withdraw(
          //  v-if="scope.row.id in PEGS[network.name]",
          //  :token="{contract: scope.row.contract, symbol: scope.row.currency, precision: Number(scope.row.decimals)}"
          //).float-right
          //BOSIbc(
          //  v-if="$store.state.ibcTokens.includes(scope.row.contract)"
          //  :token="{contract: scope.row.contract, symbol: scope.row.currency, precision: Number(scope.row.decimals)}"
          //)
</template>

<script>
import { mapGetters, mapState } from 'vuex'

import TokenTransfer from '~/components/wallet/TokenTransfer'
import Withdraw from '~/components/withdraw/Withdraw'
import PEGS from '~/core/ibc/pegs'

import TokenImage from '~/components/elements/TokenImage'

export default {
  components: {
    TokenImage,
    Withdraw,
    TokenTransfer
  },

  data() {
    return {
      search: '',
      PEGS
    }
  },

  computed: {
    ...mapGetters(['user']),
    ...mapState(['network', 'markets']),

    balances() {
      if (!this.user.balances) return []

      return this.user.balances.filter(b => {
        if (parseFloat(b.amount) == 0) return false

        return b.id.toLowerCase().includes(this.search.toLowerCase())
      }).sort((a, b) => a.contract == this.network.baseToken.contract ? -1 : 1)
    }
  },

  methods: {
    sortByAmount(a, b) {
      return parseFloat(a.amount) > parseFloat(b.amount) ? 1 : -1
    },

    cellClick(asset, cell) {
      if (cell.label == 'Asset') {
        if (this.hasMarket(asset)) {
          this.$router.push({ name: 'trade-index-id', params: { id: asset.id.replace('@', '-') } })
        }
      }
    },

    hasMarket(row) {
      if (!this.markets) return []

      const [market] = this.markets.filter(m => m.quote_token.str == row.id)

      return !!market
    }
  }
}

</script>

<style lang="scss">
.wallet {
  .el-menu {
    height: 100%;
  }

  .el-table__row {
    cursor: auto;

    td:first-child:hover {
      cursor: pointer;
      //background-color: #eff1f5;
    }
  }

  .el-menu-item, .el-submenu__title {
    padding-left: 0px !important;
  }
}
</style>
