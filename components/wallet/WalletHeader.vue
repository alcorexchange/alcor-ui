<template lang="pug">
.wallet-header.alcor-card
  .item
    .title.cancel Portfolio value
    .value
      span.main 1500.243
      span.symbol.cancel WAX
    .info.cancel = $229.11
  .item
    .title.cancel Active positions
      el-tooltip(class="item" effect="dark" content="Scanning for active positions.."
      placement="right-start" v-if="$store.state.userOrdersLoading")
        i.el-icon-loading.ml-1.pointer
    .value
      span.main
        span.buy.green {{ buyPositionsCount }} Buy
        span.cancel.line |
        span.sell.red {{ sellPositionsCount }} Sell
    .info.cancel {{ pairsCount }} Pairs
  .item
    .title.cancel Available funds
    .value
      span.main 1500.243
      span.symbol.cancel WAX
    .info.cancel = $229.11
  .item
    .title.cancel Staking rewards
    .value
      span.main 1500.243
      span.symbol.cancel WAX
    .info.cancel Last Claim: 0.00005
  .item
    .title.cancel LP rewards
    .value
      span.main.green +17.382
      span.symbol.cancel WAX
    .info.cancel 2 Liquidity Pools
</template>

<script>
import { mapGetters } from 'vuex'

export default {
  name: 'WalletHeader',

  computed: {
    ...mapGetters({
      buyPositionsCount: 'wallet/buyPositionsCount',
      sellPositionsCount: 'wallet/sellPositionsCount',
      pairsCount: 'wallet/pairsCount'
    })
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
</style>
