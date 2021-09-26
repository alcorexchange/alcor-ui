<template lang="pug">
  div.wallet-tab-bar
    AlcorLink.tab-bar-item(v-for="{name, to, exact} in urls" :to="to" :exact="exact") {{name}}
</template>

<script>
import AlcorLink from '../AlcorLink.vue'
export default {
  components: { AlcorLink },
  name: 'WalletTabBar',
  data: () => ({
    urls: [
      { name: 'Tokens', to: '/wallet_new', exact: true },
      { name: 'Positions', to: '/wallet_new/positions' },
      { name: 'Transactions', to: '/wallet_new/transactions' },
      { name: 'NFT’s', to: '/wallet_new/nfts', isNFT: true },
      { name: 'Liquidity Pools', to: '/wallet_new/liquidity_pools' },
      { name: 'Resources', to: '/wallet_new/resources' }
    ]
  })
}
</script>

<style scoped lang="scss">
.wallet-tab-bar {
  display: flex;
}
.tab-bar-item {
  flex: 1;
  border-radius: 8px;
  padding: 12px;
  margin: 0 8px;
  &:first-child {
    margin-left: 0;
  }
  &:last-child {
    margin-right: 0;
  }
  &.active {
    background: var(--hover);
  }
}
</style>
