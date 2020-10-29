<template lang="pug">
  .empty-div
</template>

<script>
import { Name, SymbolCode } from 'eos-common'
import { captureException } from '@sentry/browser'

export default {
  async fetch({ redirect, store, error, params }) {
    if (!params.id) redirect({ name: 'markets' })

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

    store.commit('market/setId', market_id)

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
  }
}
</script>
