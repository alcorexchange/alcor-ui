<template lang="pug">
  .actions(v-if="this.$store.state.user")
    copy.pointer(@click="copyUserName" width="20" height="20" :color="color")
</template>

<script>
import Copy from '~/components/svg-icons/Copy.vue'

export default {
  components: { Copy },
  computed: {
    color() {
      return this.$colorMode.preference !== 'dark' ? '#303133' : '#BDBDBD'
    }
  },
  methods: {
    copyUserName() {
      navigator.clipboard.writeText(this.$store.state.user.name)
      this.$notify({
        title: 'Clipboard',
        message: 'Account name copyed to Clipboard',
        type: 'info'
      })
    }
  }
}
</script>
