<template lang="pug">
div
  el-button(@click="open" type="primary" size="small") Connect wallet

  el-dialog(title="Select Wallet", :visible.sync="visible" width="50%" :append-to-body="true")
    .row
      .col-auto.pr-0.py-1
        el-button(size="large" @click="scatter").mb-2
          img(src="~/assets/logos/scatter.svg" height="30").mr-2
          span Scatter
      .col.py-1
        el-button(size="large" @click="wax" v-if="network.name == 'wax'").mb-2
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
        this.visible = false
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
          this.visible = false
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
