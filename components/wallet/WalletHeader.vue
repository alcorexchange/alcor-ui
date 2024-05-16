<template lang="pug">
.wallet-header.alcor-card
  .item.portfolio
    .title.cancel.fs-12 {{ $t('Portfolio value') }}
    .value
      span.main {{ systemBalance.split(' ')[0] | commaFloat }}
      //span.main {{ portfolioUSDValue | commaFloat }}
      span.symbol.cancel {{ this.$store.state.network.baseToken.symbol }}
    //.info.cancel.fs-12 = ${{ $systemToUSD(systemBalance) }}
    .info.cancel.fs-12 = ${{ portfolioUSDValue | commaFloat(2) }}

  .cards-container
    .cards
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
      portfolioUSDValue: 'wallet/portfolioUSDValue',
      systemBalance: 'systemBalance',
      network: 'network',
    }),

    lpRewards() {
      let total = 0

      this.$store.getters['amm/positions'].forEach((p) => {
        const { tokenA, tokenB } = p.pool

        total += parseFloat(
          this.$tokenToUSD(p.feesA, tokenA.symbol, tokenA.contract)
        )
        total += parseFloat(
          this.$tokenToUSD(p.feesB, tokenB.symbol, tokenB.contract)
        )
      })

      return total.toFixed(2)
    },
  },
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
  padding: 16px 8px;
  display: grid;
  grid-template-columns: 20% 1fr;
}
.cards {
  display: grid;
  grid-template-columns: repeat(4, 25%);
}
.item {
  padding: 8px;
}

.line {
  margin: 0 4px;
  width: 2px;
}

@media only screen and (max-width: 980px) {
  .wallet-header {
    padding: 0;
    background: transparent;
    gap: 4px;
    display: flex;
    flex-direction: column;
    box-shadow: none;
  }
  .item {
    background: var(--background-color-secondary);
    border-radius: var(--radius);
  }
  .cards {
    gap: 8px;
    overflow-x: auto;
    display: flex;
    gap: 4px;
    .item {
      flex: 1;
      min-width: 200px;
    }
    &::-webkit-scrollbar {
      height: 4px;
    }
  }
}

@media only screen and (max-width: 680px) {
  .cards-container {
    position: relative;
    &::after {
      content: '';
      position: absolute;
      height: 100%;
      width: 80px;
      right: 0;
      top: 0;
      background: linear-gradient(
        to left,
        var(--background-color-base),
        transparent
      );
      z-index: 2;
      pointer-events: none;
    }
  }
  .cards {
    position: relative;
    padding-right: 80px;
  }
  .portfolio {
    .value .main {
      font-weight: bold;
      background: var(--main-action-green);
      background: linear-gradient(
        to right,
        var(--main-action-green) 0%,
        var(--secondary-green) 100%
      );
      background-clip: text;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      font-size: 2rem;
    }
  }
}

//   .item {
//   }
// }

// @media only screen and (max-width: 540px) {
//   .item {
//   }
// }

.green {
  color: var(--main-green) !important;
}

.red {
  color: var(--main-red) !important;
}
</style>
