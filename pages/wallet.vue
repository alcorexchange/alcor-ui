<template lang="pug">
auth-only.wallet-layout
  WalletAccount
  WalletHeader.mt-3
  WalletTabBar.mt-3
  .mt-3
    nuxt-child
</template>

<script>
import { mapGetters } from 'vuex'
import WalletName from '~/components/wallet/WalletName.vue'
import WalletAccount from '~/components/wallet/WalletAccount.vue'
import WalletHeader from '~/components/wallet/WalletHeader.vue'
import SSpacer from '~/components/SSpacer.vue'
import WalletTabBar from '~/components/wallet/WalletTabBar.vue'
import AuthOnly from '~/components/AuthOnly'

export default {
  components: {
    WalletName,
    WalletHeader,
    SSpacer,
    WalletTabBar,
    WalletAccount,
    AuthOnly
  },
  computed: {
    ...mapGetters(['user'])
  }
}
</script>

<style scoped lang="scss">
.wallet-layout {
  margin: 0 auto;
  padding-top: 25px;
}

</style>
