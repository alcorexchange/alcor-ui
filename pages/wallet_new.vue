<template>
  <div class="wallet-layout">
    <WalletName />
    <SSpacer high />
    <WalletHeader />
    <SSpacer high />
    <SSpacer high />
    <WalletTabBar />
    <nuxt-child />
  </div>
</template>

<script>
import WalletName from '~/components/wallet/WalletName.vue'
import WalletHeader from '~/components/wallet/WalletHeader.vue'
import SSpacer from '~/components/SSpacer.vue'
import WalletTabBar from '~/components/wallet/WalletTabBar.vue'
export default {
  components: { WalletName, WalletHeader, SSpacer, WalletTabBar }
}
</script>

<style scoped lang="scss">
.wallet-layout {
  padding-top: 25px;
}
</style>
