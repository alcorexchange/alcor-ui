<template lang="pug">
  el-table(:data='deals' max-height="260")
    el-table-column(label='Type' width="50")
      template(slot-scope='scope').text-success
        span.text-success(v-if="scope.row.type == 'buymatch'") BID
        span.text-danger(v-else) SELL

    el-table-column(label='Date' width="80" v-if="!isMobile")
      template(slot-scope='scope')
        span {{ scope.row.time | moment('DD-MM HH:mm')}}

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

</template>

<script>
import { mapState } from 'vuex'

export default {
  data() {
    return {
      orders: []
    }
  },

  computed: {
    ...mapState(['userDeals']),
    ...mapState('market', ['base_token', 'quote_token', 'id']),

    deals() {
      return this.userDeals.filter(d => d.market == this.id)
    }
  },

  mounted() {
    // Not need for now
    //this.$store.dispatch('fetchUserDeals')
  }
}

</script>

<style>
.market-row div {
  font-size: 13px;
}
</style>
