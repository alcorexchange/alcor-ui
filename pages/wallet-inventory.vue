<template>
  <div class="wallet-layout">
    <WalletName />
    <SSpacer high />
    <WalletHeader />
    <SSpacer high />
    <SSpacer high />
    <WalletTabBar />
    <SSpacer high />
    <SSpacer high />
    <WalletNFTHeader />
    <div class="content">
      <nuxt-child />
    </div>
  </div>
</template>

<script>
import WalletName from '~/components/wallet/WalletName.vue'
import WalletHeader from '~/components/wallet/WalletHeader.vue'
import WalletNFTHeader from '~/components/wallet/WalletNFTHeader.vue'
import SSpacer from '~/components/SSpacer.vue'
import WalletTabBar from '~/components/wallet/WalletTabBar.vue'
export default {
  components: {
    WalletName,
    WalletHeader,
    SSpacer,
    WalletTabBar,
    WalletNFTHeader,
  },
}
</script>

<style scoped lang="scss">
.wallet-layout {
  padding-top: 25px;
}
.content {
  padding: 25px 0;
}
</style>
