<template lang="pug">
  div(v-if="user")
    slot
  div(v-else)
    el-button(@click="login" type="primary").w-100 Connect Wallet

</template>

<script>
import { mapGetters } from 'vuex'

export default {
  computed: {
    ...mapGetters(['user'])
  },

  methods: {
    login() {
      this.$store.dispatch('modal/login')
    }
  }
}
</script>
