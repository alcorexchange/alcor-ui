<template lang="pug">
  div.wallet
    .table-header
      el-input(prefix-icon="el-icon-search" placeholder="Search name or paste address")
      //- TODO: add date selecting
      el-checkbox() show trades
      el-checkbox() show deposits
      el-checkbox() show withdraws
    .table.el-card.is-always-shadow
      el-table.market-table(
        :data='mock',
        style='width: 100%',
      )
        el-table-column(label='Date')
          template(slot-scope='{row}') {{row.date}}

        el-table-column(label='Asset',)
          template(slot-scope='{row}') {{row.asset}}
        el-table-column(
          label='Action',
        )
          template(slot-scope='{row}') {{ row.type }}
        el-table-column(
          label='Price',
        )
          //- TODO: dynamic
          template(slot-scope='{row}') {{ row.price }}
        el-table-column(
          label='Fill',
        )
          template(slot-scope='{row}') {{row.fill}}
        el-table-column(
          label='Fee',
        )
          template(slot-scope='{row}') {{row.fee}} WAX
        el-table-column(
          label='Total',
          align="right"
        )
          template(slot-scope='{row}') {{row.total}}
  </div>
</template>

<script>
import { mapGetters, mapState } from 'vuex'
import TokenImage from '@/components/elements/TokenImage'
export default {
  name: 'WalletTransactions',
  components: {
    TokenImage
  },
  data: () => ({
    search: '',
    mock: [
      {
        date: '03/08/2021 12:26:28',
        asset: 'TLM/WAX',
        total: 3000,
        type: 'Buy',
        price: '0.20342',
        fill: 10.8,
        fee: 0.1,
      }
    ]
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
.table-header{
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  .el-input{
    width: auto;
    min-width: 300px;
    margin-right: 8px;
  }
  .el-input__inner{
    background: transparent !important;
  }
}
td.el-table__expanded-cell{
  background: var(--bg-alter-2) !important;
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
.el-table__expanded-cell{
  padding: 10px !important;
}
.actions{
  display: flex;
  .el-button{
    &.red{
      color: var(--main-red) !important;
    }
    &.green{
      color: var(--main-green) !important;
    }
  }
}
</style>
