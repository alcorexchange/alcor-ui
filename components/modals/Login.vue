<template lang="pug">
.row(v-loading="loading")
  .col-auto
    .d-flex.flex-wrap
      .mb-2.mr-2
        el-button(size="large" @click="login(0)")
          img(src="~/assets/logos/scatter.svg" height="30").mr-2
          span Scatter
      .mb-2.mr-2
        el-button(size="large" @click="login(1)")
          img(src="~/assets/logos/token_poket.png" height="30").mr-2
          span TokenPoket

      .mb-2.mr-2
        el-button(size="large" @click="login(2)")
          img(src="~/assets/logos/anchor.svg" height="30").mr-2
          span Anchor

      .mb-2.mr-2
        el-button(size="large" @click="login(3)")
          img(src="~/assets/logos/simpleos.svg" height="30").mr-2
          span SimplEOS

      .mb-2.mr-2
        el-button(size="large" @click="login(4)")
          img(src="~/assets/logos/keycat.svg" height="30").mr-2
          span Keycat

      .mb-2.mr-2
        el-button(size="large" @click="login('wax')" v-if="network.name == 'wax'")
          img(src="~/assets/logos/wax.svg" height="30").mr-2
          span Wax Cloud Wallet
</template>

<script>
import { captureException } from '@sentry/browser'
import { mapState } from 'vuex'

export default {
  data() {
    return {
      loading: false
    }
  },

  computed: {
    ...mapState(['user', 'network'])
  },

  mounted() {
    console.log('login mounted')
  },

  methods: {
    async login(provider) {
      this.loading = true

      try {
        await this.$store.dispatch('chain/login', provider)
        this.$store.dispatch('modal/closeModal')
      } catch (e) {
        captureException(e)
        this.$notify({ title: 'Scatter login error', message: e, type: 'error' })
      } finally {
        this.loading = false
      }
    }
  }
}
</script>
