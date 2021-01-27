<template lang="pug">
.row
  .col
    .row.mb-2(v-if="network.SCAM_CONTRACTS.includes($store.state.market.token.contract)")
      .col
        el-alert(type="error" show-icon)
          .lead Potential SCAM token!

    DesktopTrade(v-if="!isMobile")
    MobileTrade(v-else)
</template>

<script>
import { Name, SymbolCode } from 'eos-common'
import { captureException } from '@sentry/browser'
import { mapGetters, mapState } from 'vuex'

import DesktopTrade from '~/components/trade/DesktopTrade'
import MobileTrade from '~/components/trade/MobileTrade'

export default {
  layout: 'embed',

  components: {
    MobileTrade,
    DesktopTrade
  },

  async fetch({ store, error, params }) {
    const [symbol, contract] = params.id.split('-')

    let market_id

    if (contract && symbol) {
      if (store.state.network.name == 'bos') {
        // Old api of bos chain
        if (!store.state.markets.length) {
          await store.dispatch('loadMarkets')
        }

        const market = store.state.markets.filter(m => m.token.str == `${symbol}@${contract}`)[0]

        if (market) {
          market_id = market.id
        } else {
          return error(`Market ${symbol}@${contract} not found!`)
        }
      } else {
        // If it's slug use >= node v2.0
        const i128_id = new Name(contract).value.shiftLeft(64).or(new SymbolCode(symbol.toUpperCase()).raw()).toString(16)

        const { rows: [market] } = await store.getters['api/rpc'].get_table_rows({
          code: store.state.network.contract,
          scope: store.state.network.contract,
          table: 'markets',
          lower_bound: `0x${i128_id}`,
          key_type: 'i128',
          index_position: 2,
          limit: 1
        })

        if (market == undefined || !(market.token.sym.includes(symbol) && market.token.contract == contract)) {
          return error(`Market ${symbol}@${contract} not found!`)
        } else {
          market_id = market.id
        }
      }
    } else {
      market_id = params.id
    }

    store.dispatch('market/setMarket', { id: market_id })

    try {
      await Promise.all([
        store.dispatch('market/fetchMarket'),
        store.dispatch('market/fetchOrders'),
        store.dispatch('market/fetchDeals')
      ])
    } catch (e) {
      captureException(e)
      return error({ message: e, statusCode: 500 })
    } finally {
    }
  },

  data() {
    return {
      price: 0.0,
      amount: 0.0,

      no_found: false,
      loading: false
    }
  },

  computed: {
    ...mapState(['network']),
    ...mapGetters('chain', ['rpc', 'scatter']),
    ...mapState('market', ['token', 'id', 'stats']),
    ...mapGetters(['user']),

    isPeg() {
      return Object.keys(this.network.pegs).includes(this.token.str)
    }
  },

  head() {
    return {
      title: `Alcor Exchange | Market ${this.token.symbol.name}`,

      meta: [
        { hid: 'description', name: 'description', content: `Trade ${this.token.str} token for EOS` }
      ]
    }
  }
}
</script>

<style scoped>
.bordered {
  border-right: 1px solid;
}

.trade-window {
  min-height: 650px;
}

.el-form-item {
  margin-bottom: 0px;
}

.el-card__body {
    padding: 10px;
}

input[type=number]::-webkit-inner-spin-button,
input[type=number]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.display-4 {
  font-size: 2.5rem;
  font-weight: 230;
  line-height: 1;
}
</style>
