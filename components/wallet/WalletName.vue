<template lang="pug">
.wallet-name(v-if="this.$store.state.user")
  .name
    | {{ this.$store.state.user.name }}
</template>

<script>
export default {
  name: 'WalletName',
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
