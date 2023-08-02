<template lang="pug">
.wallet-header.alcor-card
  .item
    .title.cancel.fs-12 {{ $t('Portfolio value') }}
    .value
      span.main {{ systemBalance.split(' ')[0] | commaFloat }}
      span.symbol.cancel {{ this.$store.state.network.baseToken.symbol }}
    .info.cancel.fs-12 = ${{ $systemToUSD(systemBalance) }}
  .item
    .title.cancel.fs-12 {{ $t('Active positions') }}
      el-tooltip(class="item" effect="dark" content="Scanning for active positions might take some time"
      placement="right-start" v-if="$store.state.userOrdersLoading")
        i.el-icon-loading.ml-1.pointer
    .value
      span.main
        span.buy.green {{ buyPositionsCount }} {{ $t("Buy") }}
        span.cancel.line |
        span.sell.red {{ sellPositionsCount }} {{ $t("Sell") }}
    .info.cancel.fs-12 {{ pairsCount }} {{ $t('Pairs') }}
  .item
    .title.cancel.fs-12 {{ $t('Available funds') }}
    .value
      span.main {{ systemBalance.split(' ')[0] | commaFloat }}
      span.symbol.cancel {{ this.$store.state.network.baseToken.symbol }}
    .info.cancel.fs-12 = ${{ $systemToUSD(systemBalance) }}
  .item
    .title.cancel.fs-12 {{ $t('Staking rewards') }}
    .value
      span.main 0.0000
      span.symbol.cancel WAX
    .info.cancel.fs-12 {{ $t('Last Claim') }}: 0.00000
  .item.pointer(@click="$router.push('/positions')")
    .title.cancel.fs-12 {{ $t('LP rewards') }}
    .value
      span.main.green + ${{ lpRewards }}
    .info.cancel.fs-12(v-if="this.$store.state.amm.positions") {{ this.$store.state.amm.positions.length }} {{ $t("Liquidity Pools") }}
</template>

<script>
import { mapGetters } from 'vuex'

export default {
  name: 'WalletHeader',

  computed: {
    ...mapGetters({
      buyPositionsCount: 'wallet/buyPositionsCount',
      sellPositionsCount: 'wallet/sellPositionsCount',
      pairsCount: 'wallet/pairsCount',
      systemBalance: 'systemBalance',
      network: 'network'
    }),

    lpRewards() {
      let total = 0

      this.$store.getters['amm/positions'].forEach(p => {
        const { tokenA, tokenB } = p.pool

        total += parseFloat(this.$tokenToUSD(p.feesA, tokenA.symbol, tokenA.contract))
        total += parseFloat(this.$tokenToUSD(p.feesB, tokenB.symbol, tokenB.contract))
      })

      return total.toFixed(2)
    }
  }
}
</script>

<style scoped lang="scss">
.main {
  font-size: 1.1rem;
  font-weight: 500;
  padding-right: 4px;
}

.symbol {
  font-size: 0.86rem;
}

.title,
.value,
.info {
  padding: 2px;
}

.wallet-header {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
}

.line {
  margin: 0 4px;
  width: 2px;
}

@media only screen and (max-width: 840px) {
  .wallet-header {
    justify-content: center;
    background: transparent;
    padding: 0;
  }

  .item {
    background: var(--background-color-secondary);
    padding: 10px;
    margin: 4px;
    border-radius: var(--radius);
  }
}

@media only screen and (max-width: 540px) {
  .wallet-header {
    flex-direction: column;
  }

  .item {
    background: var(--background-color-secondary);
    padding: 10px;
    margin: 4px;
    border-radius: var(--radius);
  }
}

.green {
  color: var(--main-green) !important;
}

.red {
  color: var(--main-red) !important;
}
</style>
