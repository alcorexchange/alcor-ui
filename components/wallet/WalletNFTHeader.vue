<template lang="pug">
.wallet-header.alcor-card
  .item
    .title.cancel NFT inventory
    .value
      span.main 37
      span.symbol.cancel NFTs
    .info.cancel = $28.72
  .item
    .title.cancel Active Auctions
    .value
      span.main 37 NFTs
      span.symbol.cancel NFTs
    .info.cancel = $28.72
  .item
    .title.cancel Active Listings
    .value
      span.main 37
      span.symbol.cancel NFTs
    .info.cancel = $28.72
  .item
    .title.cancel Total Bought
    .value
      span.main 374
      span.symbol.cancel.wax WAX
    .info.cancel = ${{ $systemToUSD(374) }}
  .item
    .title.cancel Total Sold
    .value
      span.main 230
      span.symbol.cancel.wax WAX
    .info.cancel = ${{ $systemToUSD(230) }}
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
