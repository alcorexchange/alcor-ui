<template lang="pug">
div.wallet
  .table-header
    el-input(
      v-model="search"
      prefix-icon="el-icon-search"
      :placeholder="$t('Search market') + ' ..'"
      size="small"
      clearable
    )

    el-checkbox(
      v-model="onlyBuy"
      id="onlyBuy"
    ) {{ $t('Only buy orders') }}

    el-checkbox(
      v-model="onlySell"
      id="onlySell"
    ) {{ $t('Only sell orders') }}

    .d-flex.flex-wrap.justify-content-between.w-100
      .cancel {{ $t('Total orders') }}: {{ accountLimits.orders_total }}

      .cancel {{ $t('Order slot limit') }}: {{ accountLimits.orders_limit }}

      el-button.btn(size="mini" @click="openInNewTab('https://t.me/alcorexchange')") {{ $t('Buy more order slots') }}

  virtual-table(:table="virtualTableData")
    template(#row="{ item }")
      wallet-position-row(:item="item")

</template>

<script>
import { mapGetters, mapState } from 'vuex'
import TokenImage from '@/components/elements/TokenImage'
import VirtualTable from '@/components/VirtualTable'
import WalletPositionRow from '@/components/wallet/WalletPositionRow'
import SelectUI from '~/components/UI/input/selectUI.vue'

export default {
  name: 'Wallet',
  components: {
    TokenImage,
    SelectUI,
    VirtualTable,
    WalletPositionRow
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

    filteredPositions() {
      return this.pairPositions.filter(el => {
        if (el.slug && !el.slug.includes(this.search.toLowerCase())) return false
        if (this.onlyBuy && !el.orderCount.buy) return false
        if (this.onlySell && !el.orderCount.sell) return false
        if (!el.quote_token || !el.base_token) return false
        return el
      })
    },

    virtualTableData() {
      const header = [
        {
          label: 'Type',
          value: 'type',
          width: '120px',
          sortable: true
        },
        {
          label: 'Order',
          value: 'type',
          width: '610px'
        },
        {
          label: 'Action',
          value: 'type',
          width: '345px'
        }
      ]

      const data = this.filteredPositions.map(({ orders }) => orders).flat()
      const itemSize = this.isMobile ? 95 : 84
      const pageMode = true

      return { pageMode, itemSize, header, data }
    },

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
    trade(position) {
      this.$router.push({
        name: `trade-index-id___${this.$i18n.locale}`,
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
      try {
        await this.$store.dispatch('market/cancelAll', orders)
      } catch (e) {
        this.$notify({ title: 'Order cancel error', message: e.message, type: 'warning' })
      }
    }
  }
}
</script>

<style scoped lang="scss">
.btn {
  height: 40px;
}

.table-header {
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

  .el-input__inner {
    background: transparent !important;
  }
}

td.el-table__expanded-cell {
  background: var(--bg-alter-2) !important;
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

.el-table__expanded-cell {
  padding: 10px !important;
}

.order-type {
  &.green {
    color: var(--main-green);
  }

  &.red {
    color: var(--main-red);
  }
}

.actions {
  display: flex;

  .el-button {
    &.red {
      color: var(--main-red) !important;
    }

    &.green {
      color: var(--main-green) !important;
    }
  }
}
</style>
