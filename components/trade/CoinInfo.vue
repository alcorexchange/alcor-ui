<template lang="pug">
  .wrapper
    .row
      .col.selectCoin(@click="isDrawer = true")
        .row.align-items-center
          .col-3.col-sm-2.logo
            TokenImage(
              :src="$tokenLogo(quote_token.symbol.name, quote_token.contract)"
              height="30"
            )
          .col.title
            p {{ quote_token.symbol.name }} &nbsp;
              a.text-muted(
                @click.stop
                :href="monitorAccount(quote_token.contract )"
                target="_blank"
              ) {{ quote_token.contract }}
            p /  {{ base_token.symbol.name }}
      .col-3.text
        .item
          p.title Change 24H
          change-percent.desc(:change="stats.change24")
        .item
          p.title Volume 24H
          p.desc.text-success {{ stats.volume24.toFixed(2) }} {{ base_token.symbol.name }}
      //- .col-12.withdraw
      //-   Withdraw(
      //-     :token="{contract: quote_token.contract, symbol: quote_token.symbol.name, precision: quote_token.symbol.precision}"
        //- v-if="hasWithdraw"
      //-   )
    el-drawer(
      :visible.sync="isDrawer"
      direction="btt"
      size="80%"
    )
      markets
</template>

<script>
import { mapState } from 'vuex'
import TokenImage from '~/components/elements/TokenImage.vue'
import ChangePercent from '~/components/trade/ChangePercent.vue'
import Withdraw from '~/components/withdraw/Withdraw.vue'
import Markets from '~/components/trade/Markets.vue'

export default {
  components: {
    TokenImage,
    ChangePercent,
    Withdraw,
    Markets
  },

  data() {
    return {
      isDrawer: false
    }
  },

  computed: {
    ...mapState(['network']),
    ...mapState('market', ['quote_token', 'base_token', 'stats']),
    hasWithdraw() {
      return Object.keys(this.network.withdraw).includes(this.quote_token.str)
    }
  },

  watch: {
    quote_token() {
      this.isDrawer = false
    }
  }
}
</script>

<style lang="scss" scoped>
  .wrapper {
    box-shadow: 0px 2px 13px 1px rgb(0 0 0 / 10%);
    background-color: #2a2a2a;
    border: none;
    margin-bottom: 5px;
    padding: 5px;
    .selectCoin {
      margin-left: 5px;
      &:hover {
        background-color: #efefef08;
        transition: .3s;
        cursor: pointer;
      }
      &>.row {
        height: 100%;
        .logo {
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .title p {
          margin: 0;
        }
      }
    }
    .text .item {
      margin: 5px 0;
      p {
        margin: 0;
      }
      .title {
        font-size: 10px;
      }
      .desc {
        font-size: 12px;
      }
    }
    // .withdraw {
    //   margin-top: 15px;
    //   text-align: end;
    // }
  }

  @media (min-width:576px) {
    .wrapper .selectCoin>.row .title p {
      display: inline-block;
    }
  }
</style>
