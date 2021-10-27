<template lang="pug">
  .wrapper
    .card-coin
      .select-coin(@click="isDrawer = true")
        .image
          TokenImage(
            :src="$tokenLogo(quote_token.symbol.name, quote_token.contract)"
            height="30"
          )
        .title
          p {{ quote_token.symbol.name }} &nbsp;
            a(
              @click.stop
              :href="monitorAccount(quote_token.contract )"
              target="_blank"
            ) {{ quote_token.contract }}
          p {{ base_token.symbol.name }}
      el-dropdown(trigger="click")
        .dropWrap
          .image
            TokenImage(
              :src="$tokenLogo(quote_token.symbol.name, quote_token.contract)"
              height="30"
            )
          .title
            p {{ quote_token.symbol.name }} &nbsp;
              a(
                @click.stop
                :href="monitorAccount(quote_token.contract )"
                target="_blank"
              ) {{ quote_token.contract }}
            p {{ base_token.symbol.name }}
          i.el-icon-arrow-down
        el-dropdown-menu(slot="dropdown")
          markets
      .desc
        .title
          p Volume 24H:
          p Change 24H:
        .val
          p.text-success {{ stats.volume24.toFixed(2) }}
          change-percent(:change="stats.change24")
    el-drawer(
      :visible.sync="isDrawer"
      direction="btt"
      size="80%"
    )
      markets
  //- .withdraw
  //-   Withdraw(
  //-     :token="{contract: quote_token.contract, symbol: quote_token.symbol.name, precision: quote_token.symbol.precision}"
  //-     v-if="hasWithdraw"
  //-   )
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
    .card-coin {
      display: grid;
      grid-template-columns: 300px 1fr;
      grid-gap: 10px;
      border: none;
      @media (max-width: 1279px) {
        background: var(--bg-big-card);
        box-shadow: var(--card-shadow);
      }
      .el-dropdown {
        display: none;
        @media (min-width: 1280px) {
          display: block;
          .dropWrap {
            padding: 5px 15px;
            background: var(--bg-big-card);
            box-shadow: var(--card-shadow);
            display: grid;
            grid-template-columns: 40px 1fr 20px;
            height: 100%;
            align-items: center;
            &:hover {
              opacity: .8;
            }
          }
        }
      }
      .select-coin {
        display: none;
        @media (max-width: 1279px) {
          padding: 5px 15px;
          background: var(--bg-big-card);
          display: grid;
          grid-template-columns: 40px 1fr;
        }
      }
      .desc {
        text-align: right;
        padding: 5px 15px;
        background: var(--bg-big-card);
        .title {
          display: none;
        }
        @media (min-width: 1280px) {
          box-shadow: var(--card-shadow);
          width: 100%;
          display: grid;
          grid-template-columns: 1fr auto auto;
          grid-gap: 10px;
          .title {
            display: block;
          }
        }
      }
      p {
        margin: 0;
      }
      .image {
        align-self: center;
      }
    }
  }
</style>
