<template lang="pug">
div.wallet
  .table-header
    el-input(
      v-model="search"
      prefix-icon="el-icon-search"
      placeholder="Search market.."
      size="small"
      clearable
    )

    el-checkbox(
      v-model="onlyBuy"
      id="onlyBuy"
    ) Only buy orders

    el-checkbox(
      v-model="onlySell"
      id="onlySell"
    ) Only sell orders

    .d-flex.ml-auto
      .cancel Total orders: {{ accountLimits.orders_total }}

      .cancel.ml-3 Order slot limit: {{ accountLimits.orders_limit }}

      el-button(size="mini" @click="openInNewTab('https://t.me/alcorexchange')").ml-3 Buy more order slots

  .table.el-card.is-always-shadow
    el-table.alcor-table(
      :data='filledPositions()',
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
                  span.order-type(:class="row.type === 'buy' ? 'green': 'red'") {{row.type}}
              el-table-column(
                label="Date",
              )
                template(#default="{row}") {{ row.timestamp | moment('DD-MM HH:mm') }}
              el-table-column(
                label="Price",
              )
                template(#default="{row}") {{ row.unit_price | humanPrice }}
              el-table-column(
                label="Bid",
              )
                template(#default="{row}") {{ row.bid.quantity | commaFloat }}
              //el-table-column(label="Filled")
                template(#default="{row}") {{row.filled}}%
              el-table-column(
                label="Ask",
              )
                template(#default="{row}")
                  .wax-value {{ row.ask.quantity | commaFloat }}
              el-table-column(
                label="Action",
              )
                template(#default="{row}")
                  .actions
                    el-button(type="text" @click="cancelOrder(row)").red.hover-opacity Cancel Order
      el-table-column(label='Asset', prop='date', :width='isMobile ? 150 : 280')
        template(slot-scope='{row}')
          .asset-container
            TokenImage(
              :src='$tokenLogo(row.quote_token.symbol.name, row.quote_token.contract)',
              :height="isMobile? '20' : '30'"
            )

            div.asset
              span.asset-name {{ row.symbol }}
              span.asset-contract.cancel {{ row.quote_token.contract }}

      el-table-column(
        label='Current Orders',
      )
        template(slot-scope='{row}')
          .current-orders
            span.green {{row.orderCount.buy}} Buy
            span.cancel &nbsp;|&nbsp;
            span.red {{row.orderCount.sell}} sell
      el-table-column(
        label='Total Quote',
      )
        template(slot-scope='{row}') {{ row.totalBase | commaFloat(row.base_token.symbol.precision) }} {{ row.base_token.symbol.name }}
      el-table-column(
        label='Total Base',
      )
        template(slot-scope='{row}') {{ row.totalQuote | commaFloat(row.quote_token.symbol.precision) }} {{ row.quote_token.symbol.name }}
      el-table-column(
        label='Actions',
        width="260"
      )
        template(slot-scope='{row}')
          .actions
            el-button(type="text" @click="trade(row)").green.hover-opacity Trade
            el-button(type="text" @click="cancelAll(row)").red.hover-opacity Cancel All Orders
</template>

<script>
import { mapGetters, mapState } from 'vuex'
import TokenImage from '@/components/elements/TokenImage'
import SelectUI from '~/components/UI/input/selectUI.vue'
export default {
  name: 'Wallet',
  components: {
    TokenImage,
    SelectUI
  },
  data: () => ({
    search: '',
    onlyBuy: false,
    onlySell: false
  }),

  computed: {
    ...mapGetters({
      user: 'user',
      pairPositions: 'wallet/pairPositions'
    }),
    ...mapState(['network', 'markets', 'accountLimits']),

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
  },

  methods: {
    filledPositions() {
      return this.pairPositions.filter(el => {
        if (!el.slug.includes(this.search.toLowerCase())) return false
        if (this.onlyBuy && !el.orderCount.buy) return false
        if (this.onlySell && !el.orderCount.sell) return false
        return el
      })
    },

    trade(position) {
      this.$router.push({
        name: 'trade-index-id',
        params: {
          id: position.slug
        }
      })
    },

    async cancelOrder(order) {
      try {
        await this.$store.dispatch('chain/cancelorder', {
          account: this.user.name,
          market_id: order.market_id,
          type: order.type == 'buy' ? 'bid' : 'ask',
          order_id: order.id
        })
      } catch (e) {
        this.$notify({ title: 'Order cancel error', message: e.message, type: 'warning' })
      }

      this.$notify({ title: 'Success', message: `Order canceled ${order.id}`, type: 'success' })
    },

    async cancelAll({ orders }) {
      await this.$store.dispatch('market/cancelAll', orders)
    }
  }
}
</script>

<style scoped lang="scss">
.table-header{
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 10px;
  gap: 30px;
  .el-input {
    max-width: 300px;
    margin-right: 8px;
    margin-bottom: 8px;
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
.order-type{
  &.green{
    color: var(--main-green);
  }
  &.red{
    color: var(--main-red);
  }
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
