<template lang="pug">
  .wallet-layout
    WalletName
    WalletHeader.mt-3
    WalletTabBar.mt-3
    .content
      nuxt-child
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
.content {
  padding: 25px 0;
}
</style>
