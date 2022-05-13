<template lang="pug">
  div.pools
    .table-header
      el-input(prefix-icon="el-icon-search" placeholder="Search name or paste address")
    .table.el-card.is-always-shadow
      el-table.market-table(
        :data='lpTokens',
        style='width: 100%',
      )
        el-table-column(label='Pools')
          template(slot-scope='{row}')
            .asset-container
              PairIcons(
                :token1="{symbol: row.pair.pool1.quantity.symbol.code().to_string(), contract: row.pair.pool1.contract}"
                :token2="{symbol: row.pair.pool2.quantity.symbol.code().to_string(), contract: row.pair.pool2.contract}"
              )

              div.asset
                span.asset-name {{ row.pair.name }}
                span.asset-contract.cancel alcor.dex

        el-table-column(label='Deposit',)
          template(slot-scope='{row}')
            .detailed-item-container
              //span.main.fwr {{row.deposit.usd}} $
              span.cancel.fontSmall {{row.deposit1 | commaFloat }}
              span.cancel.fontSmall {{row.deposit2 | commaFloat }}
        el-table-column(label='Earnings')
          template(slot-scope='{row}')
            .detailed-item-container
              //span.main.fwr {{row.deposit.usd}} $
              span.cancel.fontSmall {{ String(row.earn1) | commaFloat }}
              span.cancel.fontSmall {{ String(row.earn2) | commaFloat }}
        //el-table-column(label='Earnings WAX Value')
          //- TODO: dynamic
          template(slot-scope='{row}') 123 WAX
        el-table-column(label='Actions')
          template(slot-scope='{row}')
            .actions
              AlcorButton.add(@click="addLiquidity(row)" :disabled="isActiveAdd(row)")
                i.el-icon-plus
              AlcorButton(@click="remLiquidity(row)" :disabled="isActiveRemove(row)")
                i.el-icon-minus
</template>

<script>
import { asset } from 'eos-common'

import { mapGetters, mapState } from 'vuex'
import TokenImage from '@/components/elements/TokenImage'
import AlcorButton from '@/components/AlcorButton'
import PairIcons from '~/components/PairIcons'
import { get_amount_out, get_amount_in } from '~/utils/pools'

export default {
  name: 'WalletLiquidityPools',
  components: {
    TokenImage,
    AlcorButton,
    PairIcons
  },
  data: () => ({
    search: ''
  }),
  computed: {
    ...mapState(['network', 'liquidityPositions']),
    ...mapGetters(['user']),
    ...mapGetters('swap', ['current']),
    ...mapState('swap', ['pairs', 'withdraw_token']),

    balances() {
      if (!this.user) return []
      if (!this.user.balances) return []

      return this.user.balances
        .filter((b) => {
          if (parseFloat(b.amount) == 0) return false

          return b.id.toLowerCase().includes(this.search.toLowerCase())
        })
        .sort((a, b) =>
          a.contract == this.network.baseToken.contract ? -1 : 1
        )
    },

    lpTokens() {
      if (!this.user || !this.user.balances) return []

      return this.user.balances
        .filter((b) => (b.contract == this.network.pools.contract))
        .map((b) => {
          const position = { amount: parseFloat(b.amount) }

          const pair = this.pairs.filter(
            (p) => p.supply.symbol.code().to_string() == b.currency
          )[0]

          if (!pair) {
            console.log('NOT FOUND PAIR FOR LP TOKEN: ', b.currency)
            position.pair = { name: b.currency }
            //  && account == network.pools.contract
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
          position.asset1 = asset(
            r1.multiply(lp_tokens).divide(supply.amount),
            s1
          ).to_string()
          position.asset2 = asset(
            r2.multiply(lp_tokens).divide(supply.amount),
            s2
          ).to_string()

          position.share = (
            lp_tokens.multiply(10000).divide(supply.amount) / 100
          ).toFixed(2)

          const lposition = this.liquidityPositions.filter(
            (p) => p.pair_id == pair.id
          )[0]

          if (lposition) {
            position.deposit1 = lposition.liquidity1.toFixed(8)
            position.deposit2 = lposition.liquidity2.toFixed(8)

            const lp1 = asset(
              lposition.liquidity1.toFixed(s1.precision()) +
                ' ' +
                s1.code().to_string()
            )
            const lp2 = asset(
              lposition.liquidity2.toFixed(s2.precision()) +
                ' ' +
                s2.code().to_string()
            )

            position.earn1 = asset(
              r1.multiply(lp_tokens).divide(supply.amount),
              s1
            ).minus(lp1)
            position.earn2 = asset(
              r2.multiply(lp_tokens).divide(supply.amount),
              s2
            ).minus(lp2)

            if (this.net) {
              if (position.earn1.amount < 0 && position.earn2.amount >= 0) {
                const compensate = get_amount_out(
                  position.earn1.amount,
                  r1,
                  r2,
                  -pair.fee
                )
                position.earn1 = asset(0, s1)
                position.earn2.plus(compensate)
              } else if (
                position.earn2.amount < 0 &&
                position.earn1.amount >= 0
              ) {
                const compensate = get_amount_in(
                  position.earn2.amount,
                  r1,
                  r2,
                  -pair.fee
                )
                position.earn1.plus(compensate)
                position.earn2 = asset(0, s2)
              }
            }
          } else {
            position.earn1 = asset(0, s1)
            position.earn2 = asset(0, s2)
          }

          return position
        }).filter(lp => lp.pair.pool1 !== undefined)
    }
  },

  mounted() {
    this.fetchPositions()
  },

  methods: {
    addLiquidity({ pair }) {
      this.$store.commit('swap/setTab', '+ Liquidity')
      this.$store.dispatch('swap/setPair', pair.id)

      this.$router.push({ name: 'swap' })
    },

    remLiquidity({ amount, pair: { supply } }) {
      this.$store.commit('swap/setTab', '- Liquidity')
      this.$store.commit('swap/setWithdrawToken', {
        amount,
        symbol: supply.symbol.code().to_string(),
        contract: this.network.pools.contract,
        precision: supply.symbol.precision()
      })

      this.$router.push({ name: 'swap' })
    },

    isActiveAdd({ pair }) {
      if (!this.current || !pair.supply) return false

      return (
        this.$store.state.swap.tab == '+ Liquidity' &&
        this.current.id == pair.id
      )
    },

    isActiveRemove({ pair }) {
      if (!pair.supply) return

      return (
        this.withdraw_token.symbol == pair.supply.symbol.code().to_string() &&
        this.$store.state.swap.tab == '- Liquidity'
      )
    },

    fetchPositions() {
      if (!this.user) return

      this.$store.dispatch('loadUserLiqudityPositions')
    }
  }
}
</script>

<style scoped lang="scss">
.table-header{
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  .el-input{
    max-width: 300px;
    margin-right: 8px;
  }
  .el-input__inner{
    background: transparent !important;
  }
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
.detailed-item-container{
  display: flex;
  flex-direction: column;
}
.actions{
  display: flex;
  .add {
    background:var(--main-green);
    margin-right: 8px;
    &:hover {
      opacity: 0.8;
    }
  }
  .remove {
    background:var(--main-red);
    &:hover {
      opacity: 0.8;
    }
  }
}
</style>
