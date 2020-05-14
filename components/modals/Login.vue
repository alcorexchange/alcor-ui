<template lang="pug">
div
  el-button(@click="open" type="primary" size="small") Connect wallet

  el-dialog(title="Select Wallet", :visible.sync="visible" width="50%" :append-to-body="true")
    el-button(size="large" @click="scatter")
      img(src="~/assets/logos/scatter.svg" height="30").mr-2
      span Scatter

    el-button(size="large" @click="wax" v-if="network.name == 'wax'")
      img(src="~/assets/logos/wax.svg" height="30").mr-2
      span Wax Cloud Wallet
</template>

<script>
import { captureException } from '@sentry/browser'
import { mapGetters, mapState } from 'vuex'

// FIXME Исправить отображение на модалке

export default {
  data() {
    return {
      visible: false,
    }
  },

  computed: {
    ...mapState(['user', 'network'])
  },

  methods: {
    open() {
      this.visible = true
      //this.$notify({ title: 'Login', message: 'Pleace login first', type: 'info' })
    },

    async wax() {
      const loading = this.$loading({
        lock: true,
        text: 'Wait for wallet'
      })

      try {
        await this.$store.dispatch('chain/login', 'wax')
      } catch (e) {
        captureException(e)
        this.$notify({ title: 'Scatter login error', message: e.message, type: 'error' })
      } finally {
        loading.close()
      }
    },

    async scatter() {
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
    }
  }
}
</script>

<style>
.el-dialog__body {
  padding: 20px 20px;
}
</style>
