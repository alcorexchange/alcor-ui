<template lang="pug">
  div.wallet
    .table-header
      el-input(prefix-icon="el-icon-search" placeholder="Search name or paste address")
      el-checkbox() Hide small balances
    .table.el-card.is-always-shadow
    el-table.market-table(
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
        label='Availabel',
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
          el-button(type="text") Deposit
          el-button(type="text") Withdraw
          el-button(type="text") Pools
          el-button(type="text") Trade
      //- el-table-column(
      //-   :label='`24H Vol.`',
      //-   align='right',
      //-   header-align='right',
      //-   sortable,
      //-   sort-by='volume24',
      //-   :sort-orders='["descending", null]'
      //-   v-if='!isMobile'
      //- )
      //-   template(slot-scope='scope')
      //-     span.text-mutted {{ scope.row.volume24.toFixed(2) }} {{ scope.row.base_token.symbol.name }}

      //- el-table-column(
      //-   label='24H',
      //-   prop='name',
      //-   align='right',
      //-   header-align='right',
      //-   sortable,
      //-   width='100',
      //-   sort-by='change24',
      //-   :sort-orders='["descending", null]',
      //-   v-if='!isMobile'
      //- )
      //-   template(slot-scope='scope', align='right', header-align='right')
      //-     change-percent(:change='scope.row.change24')

      //- el-table-column(
      //-   label='7D Volume',
      //-   prop='weekVolume',
      //-   align='right',
      //-   header-align='right',
      //-   sortable,
      //-   sort-by='volumeWeek',
      //-   :sort-orders='["descending", null]',
      //- )
      //-   template(slot-scope='scope')
      //-     span.text-mutted {{ scope.row.volumeWeek.toFixed(2) }} {{ scope.row.base_token.symbol.name }}

      //- el-table-column(
      //-   label='7D Change',
      //-   prop='weekChange',
      //-   align='right',
      //-   header-align='right',
      //-   sortable,
      //-   sort-by='changeWeek',
      //-   :sort-orders='["descending", null]',
      //-   v-if='!isMobile'
      //- )
      //-   template(slot-scope='scope')
      //-     change-percent(:change='scope.row.changeWeek')
  </div>
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
.table-header{
  display: flex;
  align-items: center;
  .el-input{
    width: auto;
    min-width: 300px;
    margin-right: 8px;
  }
  .el-input__inner{
    background: transparent !important;
  }
}
.el-card{
  border: none;
}
.asset-container{
  display: flex;
  align-items: center;
  .asset{
    display: flex;
    flex-direction: column;
    margin-left: 10px;
  }
  .asset-name{
    font-weight: bold;
  }
}
.actions{
  display: flex;
  .el-button{
    color: var(--main-green)
  }
}
</style>
