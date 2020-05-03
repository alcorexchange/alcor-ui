<template lang="pug">
    div(v-if="user")
      slot
    div(v-else)
      el-button(@click="login").w-100 Pleace login to continue

</template>

<script>
import { mapGetters } from 'vuex'

export default {
  computed: {
    ...mapGetters(['user'])
  },

  methods: {
    async login() {
      if (this.$store.state.chain.scatterConnected) {
        const loading = this.$loading({
          lock: true,
          text: 'Wait for wallet'
        })

        try {
          await this.$store.dispatch('chain/login')
        } catch (e) {
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
