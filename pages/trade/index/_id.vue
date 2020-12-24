<template lang="pug">
  .empty-div
</template>

<script>
import { Name, SymbolCode } from 'eos-common'
import { mapState } from 'vuex'

export default {
  computed: {
    ...mapState('market', ['symbol', 'quote_token', 'base_token']),
  },

  async fetch({ redirect, store, error, params }) {
    if (!params.id) redirect({ name: 'markets' })

    if (!params.id.includes('_')) {
      // old style link(only quote token in id, and base are system)

      const id = `${params.id}_${store.state.network.baseToken.symbol}-${store.state.network.baseToken.contract}`
      return redirect({ name: 'trade-index-id', params: { id } })
    }

    if (!params.id.includes('_')) redirect({ name: 'markets' })

    await store.dispatch('loadMarkets')

    params.id = params.id.toLowerCase()
    let market = store.state.markets.filter(m => m.slug == params.id)[0]

    if (!market) {
      // If not market pre-loaded (might be just new created..)
      const [quote_token, base_token] = params.id.split('_')

      const [q_sym, q_contract] = quote_token.split('-')
      const [b_sym, b_contract] = base_token.split('-')

      const q_i128_id = new Name(q_contract).value.shiftLeft(64).or(new SymbolCode(q_sym.toUpperCase()).raw())
      const b_i128_id = new Name(b_contract).value.shiftLeft(64).or(new SymbolCode(b_sym.toUpperCase()).raw())

      let i256_id
      if (q_i128_id < b_i128_id)
        i256_id = q_i128_id.shiftLeft(128).or(b_i128_id).toString(16)
      else
        i256_id = b_i128_id.shiftLeft(128).or(q_i128_id).toString(16)

      const { rows } = await store.getters['api/rpc'].get_table_rows({
        code: store.state.network.contract,
        scope: store.state.network.contract,
        table: 'markets',
        lower_bound: `0x${i256_id}`,
        key_type: 'i256',
        index_position: 2,
        limit: 1
      })

      if (rows.length == 0) {
        return error(`market ${params.id} found`)
      }

      store.commit('market/setMarket', { id: rows[0].id })
      await Promise.all([
        store.dispatch('market/fetchMarket'),
        store.dispatch('market/fetchOrders'),
        store.dispatch('market/fetchDeals')
      ])
    } else {
      store.commit('market/setMarket', market)

      await Promise.all([
        store.dispatch('market/fetchOrders'),
        store.dispatch('market/fetchDeals')
      ])
    }
  },

  head() {
    return {
      title: `Alcor Exchange | Market ${this.symbol}`,

      meta: [
        {
          hid: 'description',
          name: 'description',
          content: `Trade ${this.quote_token.symbol.name} for ${this.base_token.symbol.name} onchain, with NO FEE!`
        },
        { hid: 'og:image', name: 'og:image', content: this.$tokenLogo(this.quote_token.symbol.name, this.quote_token.contract) }
      ]
    }
  }
}
</script>
