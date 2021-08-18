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
    .value
      span.main
        span.buy.green 7 Buy
        span.cancel |
        span.sell.red 8 Sell
      span.symbol.cancel WAX
    .info.cancel 5 Pairs
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
export default {
  name: 'WalletHeader'
}
</script>

<style scoped lang="scss">
.main {
  font-size: 1.1rem;
  font-weight: 500;
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
