<template lang="pug">
.row
  .col
    .row.mb-2
      .col
        .lead Liquidity Positions
          create.float-right
    .row
      .col
        el-table(:data='lpTokens' style='width: 100%').liquidity-table
          el-table-column(label='Pairs')
            template(slot-scope='scope')
              i.el-icon-time
              span(style='margin-left: 10px') {{ scope.row.pair.name }}
          el-table-column(label='Deposit')
            template(slot-scope='scope')
              small {{ scope.row.asset1.to_string() }}
              small {{ scope.row.asset2.to_string() }}

          el-table-column(label='Earning (Fees)')
            template(slot-scope='scope')
              .d-flex
                .earnings(v-if="scope.row.earn1 && scope.row.earn2")
                  small {{ scope.row.earn1.to_string() }}
                  small {{ scope.row.earn2.to_string() }}

                .ml-auto
                  el-button(
                    size="small"
                    type="success"
                    icon="el-icon-plus"
                    @click="addLiquidity(scope.row)"
                    :disabled="isActiveAdd(scope.row)"
                  )

                  el-button(
                    size="small"
                    type="primary"
                    icon="el-icon-minus"
                    @click="remLiquidity(scope.row)"
                    :disabled="isActiveRemove(scope.row)"
                  )
</template>

<script>
import { asset, number_to_asset } from 'eos-common'

import { mapGetters, mapState } from 'vuex'
import Create from '~/components/swap/Create.vue'

export default {
  components: {
    Create
  },

  data() {
    return {
      liquidity_positions: []
    }
  },

  computed: {
    ...mapState(['network']),
    ...mapGetters(['user']),
    ...mapGetters('swap', ['current']),
    ...mapState('swap', ['pairs', 'withdraw_token']),

    lpTokens() {
      if (!this.user || !this.user.balances) return []

      return this.user.balances.filter(b => b.contract == this.network.pools.contract).map(b => {
        const position = { amount: b.amount }

        const pair = this.pairs.filter(p => p.supply.symbol.code().to_string() == b.currency)[0]
        if (!pair) return console.log('NOT FOUND PAIR FOR LP TOKEN: ', b.currency)

        position.pair = pair

        const s1 = pair.pool1.quantity.symbol
        const s2 = pair.pool2.quantity.symbol

        //Formula total liquidity*LPHolder/totalLP = current balance
        const lp_tokens = asset(b.amount + ' X').amount
        position.asset1 = asset(pair.pool1.quantity.amount.multiply(lp_tokens).divide(pair.supply.amount), s1)
        position.asset2 = asset(pair.pool2.quantity.amount.multiply(lp_tokens).divide(pair.supply.amount), s2)

        const lposition = this.liquidity_positions.filter(p => p.pair_id == pair.id)[0]

        if (lposition) {
          const lp1 = number_to_asset(lposition.liquidity1.toFixed(s1.precision()), s1)
          const lp2 = number_to_asset(lposition.liquidity2.toFixed(s2.precision()), s2)

          position.earn1 = asset(pair.pool1.quantity.amount.multiply(lp_tokens).divide(pair.supply.amount), s1).minus(lp1)
          position.earn2 = asset(pair.pool2.quantity.amount.multiply(lp_tokens).divide(pair.supply.amount), s2).minus(lp2)
        } else {
          position.earn1 = asset(0, s1)
          position.earn2 = asset(0, s2)
        }

        return position
      })
    }
  },

  watch: {
    user() {
      this.fetchPositions()
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
      if (!this.current || !pair) return false

      return this.$store.state.swap.tab == '+ Liquidity' && this.current.id == pair.id
    },

    isActiveRemove({ pair }) {
      if (!pair) return

      return this.withdraw_token.symbol == pair.supply.symbol.code().to_string() && this.$store.state.swap.tab == '- Liquidity'
    },

    fetchPositions() {
      if (!this.user) return
      this.$store.getters['api/backEnd'].get(`/api/account/${this.user.name}/liquidity_positions`).then(r => {
        this.liquidity_positions = r.data
      })
    }
  }
}
</script>

<style lang="scss">
.liquidity-table {
  .el-button--small {
    padding: 12px 15px;
  }
}
</style>
