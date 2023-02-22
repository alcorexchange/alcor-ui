<template lang="pug">
.wallet
  virtual-table(v-if="loaded" :table="virtualTableData" @update="update")
    template(#row="{ item }")
      .history-row(@touch="() => redirect(item)" @click="() => redirect(item)")
        .type
          span.success(v-if="item.side == 'buy'") {{ $t('BUY') }}
          span.danger(v-else) {{ $t('SELL') }}
        .asset {{ getSymbol(item.market) }}
        .date(v-if="!isMobile") {{ item.time | moment('YYYY-MM-DD HH:mm') }}
        .amount(v-if="!isMobile") {{ item.amount | commaFloat }}
        .total {{ item.total | commaFloat }}
        .unit-price {{ item.unit_price }}
        .action(v-if="!isMobile")
          el-button.success(size="medium" type="text")
            a(:href="monitorTx(item.trx_id)" target="_blank").a-reset {{ $t('view') }}
  .row.justify-content-center(v-else)
    i.el-icon-loading
</template>

<script>
import { mapState } from 'vuex'
import VirtualTable from '@/components/VirtualTable'

export default {
  components: { VirtualTable },
  data() {
    return {
      userDeals: [],
      skip: 0,
      limit: 25
    }
  },

  computed: {
    ...mapState(['user', 'markets_obj']),
    ...mapState('market', ['base_token', 'quote_token', 'id']),
    loaded() {
      return this.markets_obj[0] && this.userDeals.length
    },

    virtualTableData() {
      const header = [
        {
          label: 'Side',
          value: 'side',
          width: '100px',
          sortable: true
        },
        {
          label: 'Asset',
          value: 'market',
          width: '105px',
          sortable: true
        },
        {
          label: 'Date',
          value: 'time',
          width: '170px',
          sortable: true,
          desktopOnly: true
        },
        {
          label: 'Amount',
          value: 'amount',
          width: '180px',
          desktopOnly: true
        },
        {
          label: 'Total',
          value: 'total',
          width: '175px'
        },
        {
          label: 'Price',
          value: 'unit_price',
          width: '155px',
          sortable: true
        },
        {
          label: 'Manage',
          value: 'change24',
          width: '195px',
          desktopOnly: true
        }
      ]

      const data = this.userDeals.map((deal) => ({
        ...deal,
        id: deal._id,
        side: this.user.name == deal.bidder ? 'buy' : 'sell',
        market_symbol: this.markets_obj[deal.market].symbol,
        amount:
          (deal.type == 'sellmatch' ? deal.bid : deal.ask) +
          ' ' +
          this.markets_obj[deal.market].quote_token.symbol.name,
        total:
          (deal.type == 'sellmatch' ? deal.ask : deal.bid) +
          ' ' +
          this.markets_obj[deal.market].base_token.symbol.name
      }))

      const itemSize = 59
      const pageMode = true

      return { pageMode, itemSize, header, data }
    }
  },

  mounted() {
    this.userDeals = []
    this.fetchDealsChank()
  },

  methods: {
    update([start, end]) {
      if (end === this.skip + this.limit) {
        this.skip += this.limit
        this.fetchDealsChank()
      }
    },
    async fetchDealsChank() {
      const { skip, limit } = this
      const params = { skip, limit }

      const { data: chank } = await this.$axios.get(
        `/account/${this.$store.state.user.name}/deals`,
        { params }
      )

      if (chank.length) this.userDeals.push(...chank)
    },
    redirect(item) {
      if (this.isMobile) window.location.href = this.monitorTx(item.trx_id)
    },
    getSymbol(market) {
      return this.markets_obj[market] ? this.markets_obj[market].symbol : ''
    }
  }
}
</script>

<style scoped lang="scss">
.history-row {
  padding: 10px 20px;
  display: flex;

  @media only screen and (max-width: 1176px) {
    font-size: 12px;
  }

  .type {
    width: 75px;

    @media only screen and (max-width: 1176px) {
      width: 33%;
    }
  }

  .asset {
    width: 125px;
    display: flex;
    justify-content: flex-end;
    text-align: right;

    @media only screen and (max-width: 1176px) {
      width: 33%;
    }
  }

  .date {
    width: 175px;
    font-size: 14px;
    display: flex;
    justify-content: flex-end;
  }

  .amount {
    width: 185px;
    display: flex;
    justify-content: flex-end;
  }

  .total {
    width: 175px;
    display: flex;
    justify-content: flex-end;

    @media only screen and (max-width: 1176px) {
      width: 33%;
    }
  }

  .unit-price {
    width: 150px;
    display: flex;
    justify-content: flex-end;

    @media only screen and (max-width: 1176px) {
      width: 33%;
    }
  }

  .action {
    width: 200px;
    display: flex;
    justify-content: flex-end;
  }
}

.table-header {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  flex-wrap: wrap;

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

.success {
  color: var(--main-green) !important;
}

.danger {
  color: var(--main-red);
}
</style>
