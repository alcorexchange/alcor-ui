<template lang="pug">
.row
  .col
    .row.mb-2
      .col
        .lead Liquidity Positions
          nuxt-link(to="/swap/create").float-right
            el-button(size="mini") Create pool
            //create.float-right
    .row
      .col(:class="{ 'p-0': isMobile }")
        el-table(:data='lpTokens' style='width: 100%').liquidity-table
          el-table-column(label='Pairs' width="120")
            template(slot-scope='scope')
              // TODO Double token i.el-icon-time
              span {{ scope.row.pair.name }}
          el-table-column(label='Deposit' width="200")
            template(slot-scope='scope')
              .small {{ scope.row.asset1 }}
              .small {{ scope.row.asset2 }}

          el-table-column(label='Pool Share' width="130")
            template(slot-scope='scope')
              span {{ scope.row.share }}%

          el-table-column
            template(slot="header" slot-scope="scope")
              .d-flex
                span Earnings
                el-checkbox(v-model="net" v-if="user && user.name == 'aw.aq.waa'" active-text="Net Profit").ml-auto Net Profit
                  small.text-muted.ml-1 (Experimental)
            template(slot-scope='scope')
              .row
                .col-lg-6
                  .earnings(v-if="scope.row.earn1 && scope.row.earn2")
                    .small {{ scope.row.earn1.to_string() }}
                    .small {{ scope.row.earn2.to_string() }}
                .col-lg-6
                  .float-right
                    el-button(
                      size="mini"
                      type="success"
                      icon="el-icon-plus"
                      @click="addLiquidity(scope.row)"
                      :disabled="isActiveAdd(scope.row)"
                    )

                    el-button(
                      size="mini"
                      type="primary"
                      icon="el-icon-minus"
                      @click="remLiquidity(scope.row)"
                      :disabled="isActiveRemove(scope.row)"
                    )
</template>

<script>
import { asset } from 'eos-common'

import { mapGetters, mapState } from 'vuex'
import { get_amount_out, get_amount_in } from '~/utils/pools'

export default {
  components: {
  },

  data() {
    return {
      net: false
    }
  },

  computed: {
    ...mapState(['network', 'liquidityPositions']),
    ...mapGetters(['user']),
    ...mapGetters('swap', ['current']),
    ...mapState('swap', ['pairs', 'withdraw_token']),

    lpTokens() {
      if (!this.user || !this.user.balances) return []

      return this.user.balances.filter(b => b.contract == this.network.pools.contract).map(b => {
        const position = { amount: b.amount }

        const pair = this.pairs.filter(p => p.supply.symbol.code().to_string() == b.currency)[0]

        if (!pair) {
          console.log('NOT FOUND PAIR FOR LP TOKEN: ', b.currency)
          position.pair = { name: b.currency }
          position.asset1 = '0.0000'
          position.asset2 = '0.0000'
          position.earn1 = '0.0000'
          position.earn2 = '0.0000'
          return position
        }

        position.pair = pair

        const supply = pair.supply

        const r1 = pair.pool1.quantity.amount
        const r2 = pair.pool2.quantity.amount

        const s1 = pair.pool1.quantity.symbol
        const s2 = pair.pool2.quantity.symbol

        const lp_tokens = asset(b.amount + ' X').amount
        position.asset1 = asset(r1.multiply(lp_tokens).divide(supply.amount), s1).to_string()
        position.asset2 = asset(r2.multiply(lp_tokens).divide(supply.amount), s2).to_string()

        position.share = (lp_tokens.multiply(10000).divide(supply.amount) / 100).toFixed(2)

        const lposition = this.liquidityPositions.filter(p => p.pair_id == pair.id)[0]

        if (lposition) {
          const lp1 = asset(lposition.liquidity1.toFixed(s1.precision()) + ' ' + s1.code().to_string())
          const lp2 = asset(lposition.liquidity2.toFixed(s2.precision()) + ' ' + s2.code().to_string())

          position.earn1 = asset(r1.multiply(lp_tokens).divide(supply.amount), s1).minus(lp1)
          position.earn2 = asset(r2.multiply(lp_tokens).divide(supply.amount), s2).minus(lp2)

          if (this.net) {
            if (position.earn1.amount < 0 && position.earn2.amount >= 0) {
              const compensate = get_amount_out(position.earn1.amount, r1, r2, -pair.fee)
              position.earn1 = asset(0, s1)
              position.earn2.plus(compensate)
            } else if (position.earn2.amount < 0 && position.earn1.amount >= 0) {
              const compensate = get_amount_in(position.earn2.amount, r1, r2, -pair.fee)
              position.earn1.plus(compensate)
              position.earn2 = asset(0, s2)
            }
          }
        } else {
          position.earn1 = asset(0, s1)
          position.earn2 = asset(0, s2)
        }

        return position
      })
    }
  },

  watch: {
    user(_new, old) {
      if (!old) this.fetchPositions()
    }
  },

  mounted() {
    this.fetchPositions()
  },

  methods: {
    addLiquidity({ pair }) {
      this.$store.commit('swap/setTab', '+ Liquidity')
      this.$store.dispatch('swap/setPair', pair.id)
    },

    remLiquidity({ amount, pair: { supply } }) {
      this.$store.commit('swap/setTab', '- Liquidity')
      this.$store.commit('swap/setWithdrawToken', {
        amount,
        symbol: supply.symbol.code().to_string(),
        contract: this.network.pools.contract,
        precision: supply.symbol.precision()
      })
    },

    isActiveAdd({ pair }) {
      if (!this.current || !pair.supply) return false

      return this.$store.state.swap.tab == '+ Liquidity' && this.current.id == pair.id
    },

    isActiveRemove({ pair }) {
      if (!pair.supply) return

      return this.withdraw_token.symbol == pair.supply.symbol.code().to_string() && this.$store.state.swap.tab == '- Liquidity'
    },

    fetchPositions() {
      if (!this.user) return

      this.$store.dispatch('loadUserLiqudityPositions')
    }
  }
}
</script>

<style lang="scss">
.liquidity-table {
  .el-button--mini {
    padding: 8px 10px;
  }

  .el-table .cell {
    padding-left: 0px;
    padding-right: 0px;
  }
}
</style>
