<template lang="pug">
  .wrapper
    .card(@click="isDrawer = true")
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
      .desc
        p.text-success {{ stats.volume24.toFixed(2) }}
        change-percent(:change="stats.change24")
    el-drawer(
      :visible.sync="isDrawer"
      direction="btt"
      size="80%"
    )
      markets
  //- .col-12.withdraw
  //-   Withdraw(
  //-     :token="{contract: quote_token.contract, symbol: quote_token.symbol.name, precision: quote_token.symbol.precision}"
    //- v-if="hasWithdraw"
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
    margin-bottom: 5px;
    .card {
      background: var(--bg-big-card);
      box-shadow: var(--card-shadow);
      display: grid;
      grid-template-columns: auto 2fr 1fr;
      grid-gap: 10px;
      border: none;
      padding: 5px 15px;
      p {
        margin: 0;
      }
      .image {
        align-self: center;
      }
      .desc {
        text-align: right;
      }
    }
  }
</style>
