<template lang="pug">
//el-table(:data="history", :prop="{prop: 'block_num', order: 'ascending'}" style='width: 100%')
el-table(:data="history", row-key="block_num'" style='width: 100%')
    el-table-column(prop='maker', label='Seller', width='125')
    el-table-column(prop='buyer', label='Buyer', width='125')
    el-table-column(label='Sell' width='200')
      template(slot-scope='scope')
        ShortToken(:token="scope.row.sell")

    el-table-column(label='Buy' width='200')
      template(slot-scope='scope')
        ShortToken(:token="scope.row.buy")

    el-table-column(prop='time', label='Time')
    el-table-column(prop='price', label='Price')
</template>

<script>
import { mapGetters } from 'vuex'

import TokenImage from '~/components/elements/TokenImage'
import ShortToken from '~/components/elements/ShortToken'

import { calculatePrice, parseOtcAsset } from '~/utils'

export default {
  components: {
    TokenImage,
    ShortToken
  },

  data() {
    return {
      history: []
    }
  },

  computed: {
    ...mapGetters(['user']),
    ...mapGetters('api', ['rpc'])
  },

  created() {
    this.fetch()
  },

  methods: {
    async fetch() {
      this.history = []

      try {
        const r = await this.rpc.get_table_rows({
          code: this.$store.state.network.otc.contract,
          scope: this.$store.state.network.otc.contract,
          table: 'results',
          reverse: true,

          limit: 1000
        })

        r.rows.map(h => {
          const t = new Date(h.time * 1000).toLocaleString().split(':')
          h.time = t[0] + ':' + t[1] + ':' + t[2]

          h.sell = parseOtcAsset(h.sell)
          h.buy = parseOtcAsset(h.buy)

          h.price = calculatePrice(h.sell, h.buy)

          h.buy.amount /= 0.9975
          h.sell.amount /= 0.9975
        })

        this.history = [
          ...this.history,
          ...r.rows
        ]
      } catch (e) {
        this.$notify({ title: 'Load history', message: e.message, type: 'error' })
      } finally {
        this.loading = false
      }
    }
  }
}

</script>
