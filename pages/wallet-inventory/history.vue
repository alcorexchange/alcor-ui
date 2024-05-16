<template lang="pug">
  div.wallet
    .table-header
      el-input(prefix-icon="el-icon-search" placeholder="Search name or paste address" size="small")
      //- TODO: add date selecting
      //el-checkbox() show trades
      //el-checkbox() show deposits
      //el-checkbox() show withdraws
    .table.el-card.is-always-shadow
      el-table.market-table(:data='deals', style='width: 100%')
        el-table-column(label='Side' width="70")
          template(slot-scope='scope').text-success
            span.text-success(v-if="scope.row.type == 'buy'") BUY
            span.text-danger(v-else) SELL

        el-table-column(label='Asset')
          template(slot-scope='{row}') {{ getSymbol(row.market) }}

        el-table-column(label='Date' v-if="!isMobile")
          template(slot-scope='scope')
            span {{ scope.row.time | moment('YYYY-MM-DD HH:mm') }}

        el-table-column(label='Ask' v-if="!isMobile")
          template(slot-scope='{ row }')
            span {{ row.ask | commaFloat }} {{ getAskSymbol(row) }}

        el-table-column(label='Bid')
          template(slot-scope='{ row }')
            span {{ row.bid | commaFloat }} {{ getBidSymbol(row) }}

        el-table-column(label='Price')
          template(slot-scope='scope')
            span {{ scope.row.unit_price }}

        el-table-column(label='Manage' align="right")
          template(slot-scope='scope')
            el-button(size="mini" type="text")
              a(:href="monitorTx(scope.row.trx_id)" target="_blank").a-reset view

        template(slot="append")
          infinite-loading(@infinite='infiniteHandler' spinner="spiral")

    //.table.el-card.is-always-shadow
      el-table.market-table(
        :data='deals',
        style='width: 100%',
      )
        el-table-column(label='Date')
          template(slot-scope='{row}') {{row.date}}

        el-table-column(label='Asset',)
          template(slot-scope='{row}') {{row.asset}}
        el-table-column(
          label='Action',
        )
          template(slot-scope='{row}') {{ row.type }}
        el-table-column(
          label='Price',
        )
          //- TODO: dynamic
          template(slot-scope='{row}') {{ row.price }}
        el-table-column(
          label='Fill',
        )
          template(slot-scope='{row}') {{row.fill}}
        el-table-column(
          label='Fee',
        )
          template(slot-scope='{row}') {{row.fee}} WAX
        el-table-column(
          label='Total',
          align="right"
        )
          template(slot-scope='{row}') {{row.total}}
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
      deals: [],
      skip: 0
    }
  },

  computed: {
    ...mapState(['user', 'markets_obj']),
    ...mapState('market', ['base_token', 'quote_token', 'id'])

    //deals() {
    //  return this.userDeals.filter(d => d.market == this.id)
    //}
  },

  watch: {
    user(to, from) {
      if (from == null || to == null) {
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
    getAskSymbol(deal) {
      const market = this.markets_obj[deal.market]

      return deal.type == 'buy' ? market.quote_token.symbol.name : market.base_token.symbol.name
    },

    getBidSymbol(deal) {
      const market = this.markets_obj[deal.market]

      return deal.type == 'buy' ? market.base_token.symbol.name : market.quote_token.symbol.name
    },

    getSymbol(market) {
      return this.markets_obj[market] ? this.markets_obj[market].symbol : ''
    },

    async infiniteHandler($state) {
      console.log('start loading...1')
      if (!this.user || !this.user.name) return
      console.log('start loading...2')

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
        deals.map(d => {
          d.type = this.user.name == d.bidder && d.type == 'buymatch' ? 'buy' : 'sell'
        })

        this.deals.push(...deals)
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

<style scoped lang="scss">
.table-header{
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  flex-wrap: wrap;
  .el-input {
    max-width: 300px;
    margin-right: 8px;
    margin-bottom: 8px;
  }
  .el-input__inner{
    background: transparent !important;
  }
}
td.el-table__expanded-cell{
  background: var(--bg-alter-2) !important;
}
.el-card{
  border: none;
}
.asset-container{
  display: flex;
  align-items: center;
  .asset{
    display: flex;
    flex-direction: column;
    margin-left: 10px;
  }
  .asset-name{
    font-weight: bold;
  }
}
.el-table__expanded-cell{
  padding: 10px !important;
}
.actions{
  display: flex;
  .el-button{
    &.red{
      color: var(--main-red) !important;
    }
    &.green{
      color: var(--main-green) !important;
    }
  }
}
</style>
