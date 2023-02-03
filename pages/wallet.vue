<template lang="pug">
.wallet-layout
  WalletAccount
  WalletHeader.mt-3
  WalletTabBar.mt-3
  .content(v-if="user")
    nuxt-child
  .d-flex.justify-content-center.p-3(v-else)
    el-button(type="default" @click='$store.dispatch("chain/mainLogin")') {{ $t('Connect Wallet') }}
</template>

<script>
import { mapGetters } from 'vuex'
import WalletName from '~/components/wallet/WalletName.vue'
import WalletAccount from '~/components/wallet/WalletAccount.vue'
import WalletHeader from '~/components/wallet/WalletHeader.vue'
import SSpacer from '~/components/SSpacer.vue'
import WalletTabBar from '~/components/wallet/WalletTabBar.vue'

export default {
  components: {
    WalletName,
    WalletHeader,
    SSpacer,
    WalletTabBar,
    WalletAccount
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

.content {
  padding: 25px 0;
}
</style>
