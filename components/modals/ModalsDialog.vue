<template lang="pug">
el-dialog(
  title='Select Wallet',
  :visible='visible',
  @close='close',
  width='50%',
  :append-to-body='true'
)
  component(:is='current')
</template>

<script>
import { mapState } from 'vuex'

import Login from '~/components/modals/Login'

export default {
  components: {
    Login
  },

  computed: {
    ...mapState('modal', ['current', 'visible'])
  },

  methods: {
    close() {
      this.$store.dispatch('modal/closeModal')
    }
  }
}
</script>

<style>
.el-dialog__body {
  padding: 20px 20px;
}
</style>
