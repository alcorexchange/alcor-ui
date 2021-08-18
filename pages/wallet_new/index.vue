<template lang="pug">
  div.wallet
    .table-header
      el-input(prefix-icon="el-icon-search" placeholder="Search name or paste address")
      el-checkbox() Hide small balances
    .el-card.is-always-shadow
      el-table.alcor-table.noHover(
        :data='balances',
        style='width: 100%',
        :default-sort='{ prop: "weekVolume", order: "descending" }'
      )
        el-table-column(label='Asset', prop='date', :width='isMobile ? 150 : 280')
          template(slot-scope='{row}')
            .asset-container
              TokenImage(
                :src='$tokenLogo(row.currency, row.contract)',
                :height="isMobile? '20' : '30'"
              )

              div.asset
                span.asset-name {{ row.currency }}
                span.asset-contract.cancel {{ row.contract }}

        el-table-column(
          label='Total',
          sort-by='amount',
          sortable,
        )
          template(slot-scope='{row}') {{ row.amount }}
        el-table-column(
          label='Available',
          sort-by='amount',
          sortable,
        )
          template(slot-scope='{row}') {{ row.amount }}
        el-table-column(
          label='In Order',
        )
          //- TODO: dynamic
          template(slot-scope='{row}') 0
        el-table-column(
          label='WAX Value',
        )
          template(slot-scope='{row}') 0
        el-table-column(
          label='Actions',
          width="260"
        )
          template(slot-scope='{row}').actions
            el-button(type="text").hover-opacity Deposit
            el-button(type="text").hover-opacity Withdraw
            el-button(type="text").hover-opacity Pools
            el-button(type="text").hover-opacity Trade
</template>

<script>
import { mapGetters, mapState } from 'vuex'
import TokenImage from '@/components/elements/TokenImage'
export default {
  name: 'Wallet',
  components: {
    TokenImage
  },
  data: () => ({
    search: ''
  }),
  computed: {
    ...mapGetters(['user']),
    ...mapState(['network', 'markets']),

    balances() {
      if (!this.user) return []
      if (!this.user.balances) return []

      return this.user.balances
        .filter((b) => {
          if (parseFloat(b.amount) == 0) return false

          return b.id.toLowerCase().includes(this.search.toLowerCase())
        })
        .sort((a, b) =>
          a.contract == this.network.baseToken.contract ? -1 : 1
        )
    }
  }
}
</script>

<style scoped lang="scss">
.table-header {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  .el-input {
    width: auto;
    min-width: 300px;
    margin-right: 8px;
  }
  .el-input__inner {
    background: transparent !important;
  }
}
.el-card {
  border: none;
}
.asset-container {
  display: flex;
  align-items: center;
  .asset {
    display: flex;
    flex-direction: column;
    margin-left: 10px;
  }
  .asset-name {
    font-weight: bold;
  }
}
.actions {
  display: flex;
  .el-button {
    color: var(--main-green);
  }
}
</style>
