<template lang="pug">
.wallet-tab-bar.mb-5
  template(v-for="(item, index) in buttonData")
    button.btn.tab-btn.d-flex.align-items-center.justify-content-center.active(v-if="currentTab === item.slug", @click='() => currentTab = item.slug') {{ item.name }}
    button.btn.tab-btn.d-flex.align-items-center.justify-content-center(v-else,  @click='() => currentTab = item.slug') {{ item.name }}
</template>

<script>
import AlcorLink from '../AlcorLink.vue'
export default {
  name: 'WalletTabBar',
  components: { AlcorLink },
  data: () => ({
    currentTab: 'default',
    buttonData: [
      { name: 'Default', slug: 'default' },
      { name: 'Golden', slug: 'golden' },
      { name: 'Diamond', slug: 'diamond' },
      { name: 'Admentit', slug: 'admentit' },
      { name: 'Thorium', slug: 'thorium' },
      { name: 'Godly', slug: 'godly' },
    ],
  }),
  watch: {
    $route() {
      this.$nextTick(() => {
        this.funcScrollTo()
      })
    },
  },
  mounted() {
    this.funcScrollTo()
  },
  methods: {
    funcScrollTo() {
      this.$scrollTo('.wallet-tab-bar .active', {
        container: '.wallet-tab-bar',
        offset: -100,
        x: true,
      })
    },
  },
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
.tab-btn {
  flex: 1;
  border-radius: 8px;
  padding: 12px;
  margin: 0 8px;
  color: var(--color-white);
  background-color: #333333;
  white-space: nowrap;
  box-shadow: none;
  height: 30px;
  &:first-child {
    margin-left: 0;
  }
  &:last-child {
    margin-right: 0;
  }
  &.active {
    color: var(--text-default);
    background: var(--main-action-green);
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
