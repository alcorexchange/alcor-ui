<template lang="pug">
el-table(:data="history", row-key="block_num'" style='width: 100%' v-loading="loading")
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
      history: [],
      loading: true
    }
  },

  computed: {
    ...mapGetters(['user'])
  },

  mounted() {
    this.fetch()
  },

  methods: {
    async fetch() {
      this.history = []

      const contract = this.$store.state.network.otc.contract

      try {
        const { data: { actions } } = await this.$axios.get(this.$store.state.network.hyperion + 'v2/history/get_actions', {
          params: {
            account: contract,
            limit: 1000,
            filter: `${contract}:matchrecord`
          }
        })

        const history = actions.map(a => {
          return { time: a['@timestamp'], ...a.act.data.record }
        }).map(h => {
          const t = new Date(h.time).toLocaleString().split(':')
          h.time = t[0] + ':' + t[1] + ':' + t[2]

          h.sell = parseOtcAsset(h.sell)
          h.buy = parseOtcAsset(h.buy)

          h.price = calculatePrice(h.sell, h.buy)

          h.buy.amount /= 0.9975
          h.sell.amount /= 0.9975

          return h
        })

        this.history = history
      } catch (e) {
        console.log(e)
        this.$notify({ title: 'Load history', message: e.message, type: 'error' })
      } finally {
        this.loading = false
      }
    }
  }
}

</script>
