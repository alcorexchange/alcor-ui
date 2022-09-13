<template lang="pug">
  div.wallet-tab-bar
    AlcorLink.tab-bar-item(
      v-for="{name, to, exact, isNFT} in urls"
      :class="{'nft-tab': isNFT}"
      :to="to"
      :exact="exact"
      :key="name"
    )
      img(v-if="isNFT" src="~/assets/images/nft-monkey.png", alt="nft-monkey")
      span {{ $t(name) }}
</template>

<script>
import AlcorLink from '../AlcorLink.vue'
export default {
  name: 'WalletTabBar',
  components: { AlcorLink },
  data: () => ({
    urls: [
      { name: 'Tokens', to: '/wallet/tokens', exact: true },
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
  flex-wrap: wrap;
  gap: 16px;
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
  white-space: nowrap;

  &.nft-tab {
    width: 100%;
    height: 100%;
    position: relative;

    img {
      position: absolute;
      height: 100%;
      max-width: 100%;
    }
  }

  &:first-child {
    margin-left: 0;
  }

  &:last-child {
    margin-right: 0;
  }

  &.active {
    background: var(--background-color-third);
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
