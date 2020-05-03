<template lang="pug">
// TODO Сделать подгрузку инфы о токене с сервиса там о дапах который

.row
  .col
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
  components: {
    MobileTrade,
    DesktopTrade
  },

  async fetch({ store, error, params }) {
    const [symbol, contract] = params.id.split('-')

    let market_id

    if (contract && symbol) {
      // If it's slug

      //if (c_market) {
      //  market_id = c_market.id
      //} else {
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

      if (!market) {
        error(`Market ${symbol}@${contract} not found!`)
      }

      market_id = market.id
      //}
    } else {
      market_id = params.id
    }

    store.commit('market/setId', market_id)

    this.loading = true
    try {
      await Promise.all([
        store.dispatch('market/fetchMarket'),
        store.dispatch('market/fetchDeals')
      ])
    } catch (e) {
      captureException(e)
      return error({ message: e, statusCode: 500 })
    } finally {
      this.loading = false
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

  created() {
    // Auto update orders
    setInterval(() => { this.$store.dispatch('market/fetchOrders') }, 5000)
  },

  head() {
    return {
      title: `Alcor Exchange | Market ${this.token.symbol.name}`,

      meta: [
        { hid: 'description', name: 'description', content: `Trade ${this.token.str}/EOS onchain, with no fee` },
        { hid: 'og:image', name: 'og:image', content: this.$tokenLogo(this.token.symbol.name, this.token.contract) }
      ]
    }
  }
}
</script>
