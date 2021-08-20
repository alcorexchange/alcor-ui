<template lang="pug">
  div.wallet
    .table-header
      el-input(prefix-icon="el-icon-search" placeholder="Search name or paste address")
      el-checkbox() Only buy orders
      el-checkbox() Only sell orders
    .table.el-card.is-always-shadow
      el-table.alcor-table(
        :data='mock',
        style='width: 100%',
      )
        el-table-column(type="expand")
          template(#default="{row}")
            .orders-container.table
              el-table(
                :data="row.orders"
                style="width: 100%"
              )
                el-table-column(
                  label="Order",
                )
                  template(#default="{row}")
                    span.order-type {{row.type}}
                el-table-column(
                  label="Date",
                )
                  template(#default="{row}") {{row.date}}
                el-table-column(
                  label="Price",
                )
                  template(#default="{row}") {{row.price}}
                el-table-column(
                  label="Amount",
                )
                  template(#default="{row}") {{row.amount}}
                el-table-column(
                  label="Filled",
                )
                  template(#default="{row}") {{row.filled}}%
                el-table-column(
                  label="Wax value",
                )
                  template(#default="{row}")
                    .wax-value {{ row.WValue }}
                el-table-column(
                  label="Action",
                )
                  template(#default="{row}")
                    .actions
                      el-button(type="text").red.hover-opacity Cancel Order
        el-table-column(label='Asset', prop='date', :width='isMobile ? 150 : 280')
          template(slot-scope='{row}')
            .asset-container
              TokenImage(
                :src='$tokenLogo(row.currency, row.contract)',
                :height="isMobile? '20' : '30'"
              )

              div.asset
                span.asset-name {{ row.pair }}
                span.asset-contract.cancel contract.name

        el-table-column(
          label='Current Orders',
        )
          template(slot-scope='{row}')
            .current-orders
              span.green {{row.orderCount.buy}} Buy
              span.cancel &nbsp;|&nbsp;
              span.red {{row.orderCount.sell}} sell
        el-table-column(
          label='Total Amount',
          sort-by='total',
          sortable,
        )
          template(slot-scope='{row}') {{ row.total }}
        el-table-column(
          label='WAX Value',
        )
          //- TODO: dynamic
          template(slot-scope='{row}') {{ row.WValue }}
        el-table-column(
          label='Actions',
          width="260"
        )
          template(slot-scope='{row}')
            .actions
              el-button(type="text").green.hover-opacity Trade
              el-button(type="text").red.hover-opacity Cancel All Orders
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
    search: '',
    mock: [
      {
        pair: 'TLM/WAX',
        id: 'alien.worlds',
        orderCount: {
          buy: 3,
          sell: 3
        },
        total: 3000,
        WValue: 1000,
        orders: [
          {
            type: 'Buy',
            date: '03/08/2021 12:26:28',
            price: '0.20342',
            amount: 2000,
            filled: 10.8,
            WValue: 1040,
          },
          {
            type: 'Buy',
            date: '03/08/2021 12:26:28',
            price: '0.20342',
            amount: 2000,
            filled: 10.8,
            WValue: 1040,
          },
        ]
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
