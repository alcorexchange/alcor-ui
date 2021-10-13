<template lang="pug">
  el-table(:data='deals' max-height="245").my-history
    el-table-column(label='Type' width="50")
      template(slot-scope='scope').text-success
        span.text-success(v-if="scope.row.type == 'buymatch'") BID
        span.text-danger(v-else) SELL

    el-table-column(label='Date' width="80" v-if="!isMobile")
      template(slot-scope='scope')
        span {{ scope.row.time | moment('DD-MM HH:mm') }}

    el-table-column(label='Ask' width="120" v-if="!isMobile")
      template(slot-scope='scope')
        span {{ scope.row.ask }}

    el-table-column(label='Bid' width="120")
      template(slot-scope='scope')
        span {{ scope.row.bid }}

    el-table-column(label='Price' width="70")
      template(slot-scope='scope')
        span {{ scope.row.unit_price }}

    el-table-column(label='Manage' align="right" width="60")
      template(slot-scope='scope')
        el-button(size="mini" type="text")
          a(:href="monitorTx(scope.row.trx_id)" target="_blank").a-reset view

    template(slot="append")
      infinite-loading(@infinite='infiniteHandler' spinner="spiral" force-use-infinite-wrapper=".my-history .el-table__body-wrapper")

</template>

<script>
import { mapState } from 'vuex'
import InfiniteLoading from 'vue-infinite-loading'

export default {
  components: {
    InfiniteLoading
  },

  data() {
    return {
      orders: [],
      deals: [],
      skip: 0
    }
  },

  computed: {
    ...mapState(['user']),
    ...mapState('market', ['base_token', 'quote_token', 'id'])

    //deals() {
    //  return this.userDeals.filter(d => d.market == this.id)
    //}
  },

  watch: {
    user(to, from) {
      if (from == null) {
        this.deals = []
        this.skip = 0

        // Initial fill
        this.infiniteHandler({
          loaded: () => {},
          complete: () => {}
        })
      }
    }
  },

  mounted() {
    // Initial fill
    this.infiniteHandler({
      loaded: () => {},
      complete: () => {}
    })
  },

  methods: {
    async infiniteHandler($state) {
      console.log('try loading')
      if (!this.user || !this.user.name) return
      console.log('start loading')

      const { data: deals } = await this.$axios.get(
        `/account/${this.user.name}/deals`,
        {
          params: {
            limit: 100,
            skip: this.skip
          }
        }
      )

      this.skip += deals.length

      if (deals.length) {
        this.deals.push(...deals.filter((d) => d.market == this.id))
        $state.loaded()
        console.log('loaded')
      } else {
        $state.complete()
        console.log('complete')
      }
    }
  }
}
</script>

<style lang="scss">
.market-row div {
  font-size: 13px;
}

.my-history {
  table {
    width: 100% !important;
  }

  .el-table__append-wrapper {
    //overflow: auto;
  }
}
</style>
