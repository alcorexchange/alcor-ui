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
          el-table-column(label='Pairs' width='280')
            template(slot-scope='scope')
              i.el-icon-time
              span(style='margin-left: 10px') {{ scope.row.pair.name }}
          el-table-column(label='Deposit' width='180')
            template(slot-scope='scope')
              small {{ scope.row.asset1.to_string() }}
              small {{ scope.row.asset2.to_string() }}

          el-table-column(label='Earning (Fees)')
            template(slot-scope='scope')
              .d-flex
                .ml-auto
                  el-button(size="small" type="success" icon="el-icon-plus" @click="addLiquidity(scope.row)")
                  //el-button(size="small" type="info" icon="el-icon-minus")
                  withdraw.ml-2
</template>

<script>
import { asset } from 'eos-common'

import { mapGetters, mapState } from 'vuex'
import Create from '~/components/swap/Create.vue'
import Withdraw from '~/components/swap/Withdraw.vue'

export default {
  components: {
    Create,
    Withdraw
  },

  computed: {
    ...mapState(['network']),
    ...mapGetters(['user']),
    ...mapState('swap', ['pairs']),

    lpTokens() {
      if (!this.user || !this.user.balances) return []

      return this.user.balances.filter(b => b.contract == this.network.pools.contract).map(b => {
        const pair = this.pairs.filter(p => p.supply.symbol.code().to_string() == b.currency)[0]

        if (pair) {
          b.pair = pair

          //Formula total liquidity*LPHolder/totalLP = current balance
          const lp_tokens = asset(b.amount + ' X').amount
          b.asset1 = asset(pair.pool1.quantity.amount.multiply(lp_tokens).divide(pair.supply.amount), pair.pool1.quantity.symbol)
          b.asset2 = asset(pair.pool2.quantity.amount.multiply(lp_tokens).divide(pair.supply.amount), pair.pool2.quantity.symbol)
        }

        return b
      })
    }
  },

  methods: {
    addLiquidity(balance) {
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
