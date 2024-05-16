<template lang="pug">
.wallet
  virtual-table(v-if="loaded" :table="virtualTableData" @update="update")
    template(#row="{ item }")
      .history-row
        .type
          div.type-content
            span(:class="item.side == 'buy' ? 'success' : 'danger'") {{ item.side == 'buy' ? $t('BUY') : $t('SELL') }}
            //- .pointer.hover-opacity.underline.fs-12(v-if="isMobile" @click="toExplore(item)") {{ item.trx_id.slice(0, 5) }}...
          //- div.type-content.pointer.hover-opacity(v-if="isMobile" :class="item.side == 'buy' ? 'success' : 'danger'")
          //-   span.underline {{ item.side == 'buy' ? $t('BUY') : $t('SELL') }}

        .asset.underline.pointer(@click="trade(item)") {{ getSymbol(item.market) }}
        .date(v-if="!isMobile") {{ item.time | moment('YYYY-MM-DD HH:mm') }}
        .amount(v-if="!isMobile") {{ item.amount | commaFloat }}
        .total {{ item.total | commaFloat }}
        .unit-price(v-if="!isMobile") {{ item.unit_price }}
        .action()
          el-button.success.hover-opacity(size="medium" type="text" @click="toExplore(item)")
            span.fs-12(v-if="isMobile") {{ $t('Explore') }}
            span(v-else) {{ $t('Explore') }}
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
      limit: 25,
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
          sortable: true,
        },
        {
          label: 'Asset',
          value: 'market',
          width: '105px',
          sortable: true,
        },
        {
          label: 'Date',
          value: 'time',
          width: '170px',
          sortable: true,
          desktopOnly: true,
        },
        {
          label: 'Amount',
          value: 'amount',
          width: '180px',
          desktopOnly: true,
        },
        {
          label: 'Total',
          value: 'total',
          width: '175px',
        },
        {
          label: 'Price',
          value: 'unit_price',
          width: '155px',
          sortable: true,
          desktopOnly: true,
        },
        {
          label: 'Manage',
          value: 'change24',
          width: '195px',
        },
      ]

      const data = this.userDeals.reduce((acc, deal) => {
        const market = this.markets_obj[deal.market]

        if (market) {
          acc.push({
            ...deal,
            id: deal._id,
            side: this.user.name === deal.bidder ? 'buy' : 'sell',
            market_symbol: market.symbol,
            amount: `${deal.type === 'sellmatch' ? deal.bid : deal.ask} ${market.quote_token.symbol.name}`,
            total: `${deal.type === 'sellmatch' ? deal.ask : deal.bid} ${market.base_token.symbol.name}`,
            marketSlug: market.slug,
          })
        } else {
          console.error(`Market not found for deal with ID: ${deal._id}`)
        }

        return acc
      }, [])

      const itemSize = 56
      const pageMode = true

      return { pageMode, itemSize, header, data }
    },
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

      const { data: chank } = await this.$axios.get(`/account/${this.$store.state.user.name}/deals`, { params })

      if (chank.length) this.userDeals.push(...chank)
    },
    toExplore(item) {
      this.openInNewTab(this.monitorTx(item.trx_id))
    },
    trade(item) {
      this.$router.push(this.localeRoute(`/trade/${item.marketSlug}`))
    },
    getSymbol(market) {
      return this.markets_obj[market] ? this.markets_obj[market].symbol : ''
    },
  },
}
</script>

<style scoped lang="scss">
.history-row {
  padding: 10px 20px;
  display: flex;
  align-items: center;

  @media only screen and (max-width: 1176px) {
    font-size: 12px;
  }

  .type {
    width: 75px;
    .type-content {
      display: flex;
      gap: 4px;
      align-items: center;
    }

    @media only screen and (max-width: 1176px) {
      width: 33%;
    }
  }

  .asset {
    width: 125px;
    display: flex;
    justify-content: flex-end;
    text-align: right;
    transition: color 0.2s;
    &:hover {
      color: var(--main-green);
    }

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

    @media only screen and (max-width: 1176px) {
      width: 33%;
    }
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
