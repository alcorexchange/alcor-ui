<template lang="pug">
div
  el-button(@click="open" type="primary" size="small") Connect wallet

  el-dialog(title="Select Wallet", :visible.sync="visible" width="25%")
    span olol
</template>

<script>
import { captureException } from '@sentry/browser'
import { mapGetters, mapState } from 'vuex'


export default {
  data() {
    return {
      visible: false,
    }
  },

  computed: {
    ...mapState(['user', 'network']),
  },

  methods: {
    open() {
      this.visible = true
      //this.$notify({ title: 'Login', message: 'Pleace login first', type: 'info' })
    },

    async login() {
      if (this.$store.state.chain.scatterConnected) {
        const loading = this.$loading({
          lock: true,
          text: 'Wait for wallet'
        })

        try {
          await this.$store.dispatch('chain/login')
        } catch (e) {
          captureException(e)
          this.$notify({ title: 'Scatter login error', message: e.message, type: 'error' })
        } finally {
          loading.close()
        }
      } else {
        this.$notify({ title: 'Scatter not found', message: 'Pleace install or unlock Scatter', type: 'info' })
      }
    },

  }
}
</script>

<style scoped>
</style>
