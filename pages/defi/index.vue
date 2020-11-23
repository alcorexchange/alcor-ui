<template lang="pug">
.row.wallet.mt-2
  .col-lg-2.pr-0
    el-menu(:default-active='defaultActiveLink' router)
      el-menu-item(index='defi-index-swap' :route="{ name: 'defi-index-swap' }" v-if="this.$store.state.network.name == 'eos'")
        i.el-icon-coin
        span DefiBox Swap
      el-menu-item(index='defi-index-pools' :route="{ name: 'defi-index-pools' }")
        i.el-icon-setting
        span Evodex

  .col-lg-10
    nuxt-child
</template>

<script>
import PleaseLoginButton from '~/components/elements/PleaseLoginButton'

export default {
  components: {
    PleaseLoginButton
  },

  asyncData({ store, redirect, route }) {
    if (route.path == '/defi') redirect({ name: 'defi-index-swap' })

    return { defaultActiveLink: route.name }
  },

  data() {
    return {
      defaultActiveLink: 'defi-index-swap'
    }
  }
}
</script>
