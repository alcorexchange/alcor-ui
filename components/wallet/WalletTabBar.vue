<template lang="pug">
  div.wallet-tab-bar
    AlcorLink.tab-bar-item(
      v-for="{name, to, exact} in urls"
      :to="to"
      :exact="exact"
      :key="name"
    ) {{name}}
</template>

<script>
import AlcorLink from '../AlcorLink.vue'
export default {
  name: 'WalletTabBar',
  components: { AlcorLink },
  data: () => ({
    urls: [
      { name: 'Tokens', to: '/wallet', exact: true },
      { name: 'Open Orders', to: '/wallet/positions' },
      { name: 'History', to: '/wallet/history' },
      { name: 'NFT’s', to: '/wallet/nfts', isNFT: true },
      { name: 'Liquidity Pools', to: '/wallet/liquidity_pools' },
      { name: 'Resources', to: '/wallet/resources' }
    ]
  }),
  watch: {
    $route() {
      this.$nextTick(() => {
        this.funcScrollTo()
      })
    }
  },
  mounted() {
    this.funcScrollTo()
  },
  methods: {
    funcScrollTo() {
      this.$scrollTo('.wallet-tab-bar .active', {
        container: '.wallet-tab-bar',
        offset: -100,
        x: true
      })
    }
  }
}
</script>

<style scoped lang="scss">
.wallet-tab-bar {
  display: flex;
  position: sticky;
  top: 0;
  z-index: 4;
  overflow: auto;
  padding: 4px 0;
  background: var(--background-color-base);
  &::-webkit-scrollbar {
    height: 4px;
    width: 4px;
    display: block;
  }
  &::-webkit-scrollbar-thumb {
    // background: rgba(gray, 0.3);
    border-radius: 5px;
  }
}
.tab-bar-item {
  flex: 1;
  border-radius: 8px;
  padding: 12px;
  margin: 0 8px;
  white-space: nowrap;
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
@media only screen and (max-width: 940px) {
  .tab-bar-item {
    border-radius: 4px;
    margin: 2px;
    padding: 6px 12px;
    font-size: 0.86rem;
  }
}
</style>
