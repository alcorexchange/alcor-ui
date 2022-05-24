<template lang="pug">
.row.wallet.mt-2
  .col-lg-2.pr-0
    el-menu(:default-active='defaultActiveLink' router)
      el-menu-item(index='wallet-index-tokens' :route="{ name: 'wallet-index-tokens' }")
        i.el-icon-coin
        span Tokens
      el-menu-item(index='wallet-index-nfts' :route="{ name: 'wallet-index-nfts' }")
        i.el-icon-setting
        span NFT's

  .col-lg-10
    PleaseLoginButton
      nuxt-child
</template>

<script>
import PleaseLoginButton from '~/components/elements/PleaseLoginButton'

export default {
  components: {
    PleaseLoginButton
  },

  asyncData({ store, redirect, route }) {
    if (route.path == '/wallet') {
      redirect({ name: 'wallet-index-tokens' })
    }

    return { defaultActiveLink: route.path.includes('nft') ? 'wallet-index-nfts' : 'wallet-index-tokens' }
  },

  data() {
    return {
      defaultActiveLink: 'wallet-index-tokens'
    }
  }
}
</script>
