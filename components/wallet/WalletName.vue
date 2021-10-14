<template lang="pug">
.wallet-name(v-if="this.$store.state.user")
  i.el-icon-wallet
  .name
    | {{ this.$store.state.user.name }}
  .actions
    i.el-icon-copy-document.pointer(@click="copyUserName")
</template>

<script>
export default {
  name: 'WalletName',

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

<style scoped lang="scss">
.wallet-name {
  display: flex;
  align-items: center;
  .name {
    font-size: 1.2rem;
    font-weight: 500;
  }
  > * {
    padding: 4px;
  }
}
</style>
