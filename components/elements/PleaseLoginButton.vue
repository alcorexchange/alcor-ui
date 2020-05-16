<template lang="pug">
    div(v-if="user")
      slot
    div(v-else)
      el-button(@click="login").w-100 Please login to continue

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
