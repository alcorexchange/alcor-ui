<template lang="pug">
div.alcor-card
  .header
    h2.title Liquidity Positions
      i.el-icon-question.ml-2.pointer(@click="openInNewTab('https://www.youtube.com/watch?v=cizLhxSKrAc&t=34s')")

    .pagination
      //i.el-icon-back
      //span Page 1 of 4
      //i.el-icon-right
      .lead
        nuxt-link(to="/swap/create").float-right
          el-button(size="mini") Create pool
      //create.float-right
  .table-header.portionated
    .pools Pools
    .deposit.p20.end Deposit
      el-popover(placement='top-start' title='Deposit' width='400' trigger='hover')
        template
          .text-break
            p When the deposit becomes negative, it means that your liquidity has been profitable, and you have withdrawn the deposit and part of dividend.
            p When you receive or transfer LP Tokens, the system will increase or decrease your deposit in proportion according to the total liquidity volume of liquidity pool.
            p There may be a difference in statistics, for reference only.

        .el-icon-info(slot="reference").ml-2.pointer
    .earning.p20.end Earning (Fees)
    .share.p10.end Pool Share
    .actions

  .table-content
    .item-container.portionated(v-for="lpToken in lpTokens")
      .pair-container.pools
        PairIcons(
          :token1="{symbol: lpToken.pair.pool1.quantity.symbol.code().to_string(), contract: lpToken.pair.pool1.contract}"
          :token2="{symbol: lpToken.pair.pool2.quantity.symbol.code().to_string(), contract: lpToken.pair.pool2.contract}"
        )
        //- .icons
        //-   TokenImage(:src="$tokenLogo(lpToken.pair.pool1.quantity.symbol.code().to_string(), lpToken.pair.pool1.contract)" height="15").icon.icon-1
        //-   TokenImage(:src="$tokenLogo(lpToken.pair.pool2.quantity.symbol.code().to_string(), lpToken.pair.pool2.contract)" height="15").icon.icon-2
        .name-container
          .names {{lpToken.pair.name}}
          .detail.muted alcor.dex
      .deposit.p20
        .label.mobile-only Deposit
        .main
          //.amount 102,121.01$ TODO
          //span.detail.muted {{lpToken.asset1}}
          //span.detail.muted {{lpToken.asset2}}
          span.detail.muted {{lpToken.deposit1 | commaFloat }}
          span.detail.muted {{lpToken.deposit2 | commaFloat }}
      .earning.p20(v-if="lpToken.earn1 && lpToken.earn2")
        .label.mobile-only Earning (Fees)
        .main
          //.amount 102,121.01$ TODO
          //- TODO: add .toString()
          span.detail.muted {{ String(lpToken.earn1) | commaFloat }}
          span.detail.muted {{ String(lpToken.earn2) | commaFloat }}
      .share.p10
        .label.mobile-only Pool Share
        .main
          //.amount 102,121.01$ TODO
          //- TODO: add .toString()
          span.detail {{ lpToken.share }}%
      .actions
        AlcorButton.add(@click="addLiquidity(lpToken)" :disabled="isActiveAdd(lpToken)")
          i.el-icon-plus
        AlcorButton(@click="remLiquidity(lpToken)" :disabled="isActiveRemove(lpToken)")
          i.el-icon-minus
  //.row
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
import AlcorButton from '@/components/AlcorButton'
import TokenImage from '~/components/elements/TokenImage'
import PairIcons from '~/components/PairIcons'
import { get_amount_out, get_amount_in } from '~/utils/pools'

export default {
  components: { AlcorButton, TokenImage, PairIcons },
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

<style lang="scss" scoped>
.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 12px;
  margin-top: 13px;
  .title {
    font-size: 1.375rem;
  }
  .pagination {
    display: flex;
    align-items: center;
  }
}
.table-header {
  margin-bottom: 12px;
  font-size: 0.8rem;
}
.portionated {
  display: flex;
  .pools {
    flex: 1;
  }
  .p20 {
    width: 24%;
  }
  .p10 {
    width: 10%;
  }
  .actions {
    width: 120px;
  }
  .end {
    display: flex;
    justify-content: flex-end;
  }
}
.table-content {
  display: flex;
  flex-direction: column;
  .item-container {
    display: flex;
    //border: 1px solid #373b3d;
    background: var(--bg-alter-1);
    border-radius: var(--radius);
    padding: 6px;
    margin-bottom: 8px;
  }
  .deposit .main,
  .earning .main,
  .share .main {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    font-size: 0.8rem;
    .detail {
      display: flex;
      justify-content: flex-end;
    }
  }
  .actions {
    display: flex;
    align-items: center;
    justify-content: center;
    .alcor-button {
      width: 30px;
      height: 30px;
    }
    .add {
      background: #1fc781;
      margin-right: 8px;
      &:hover {
        opacity: 0.8;
      }
    }
  }
}
.pair-container {
  display: flex;
  align-items: center;
  .icons {
    position: relative;
    display: flex;
    height: 40px;
    width: 40px;
    .icon {
      position: absolute;
      width: 25px;
      height: 25px;
      object-fit: cover;
      border-radius: 50%;
    }
    .icon-1 {
      top: 0;
      left: 0;
    }
    .icon-2 {
      bottom: 0;
      right: 0;
    }
  }
  .name-container {
    padding-left: 10px;
    display: flex;
    flex-direction: column;
    .detail {
      font-size: 0.8rem;
    }
  }
}
.mobile-only {
  display: none;
}
@media only screen and (max-width: 840px) {
  .mobile-only {
    display: block;
  }
  .table-header {
    display: none;
  }
  .portionated {
    .p20,
    .p10 {
      width: 100%;
    }
    .actions {
      width: 100%;
    }
  }
  .item-container {
    position: relative;
    flex-direction: column;
    .names {
      font-size: 1.2rem;
    }
    > * {
      width: 100%;
    }
    .actions {
      justify-content: flex-end;
    }
  }
  .pair-container {
    margin-bottom: 12px;
  }
  .deposit,
  .earning,
  .share {
    display: flex;
    justify-content: space-between;
    margin-bottom: 12px;
  }
  .actions {
    width: auto;
    > * {
      width: 50% !important;
      height: 35px !important;
    }
  }
}
</style>
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
