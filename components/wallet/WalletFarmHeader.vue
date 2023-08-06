<template lang="pug">
.wallet-farm-header
  .left
    .title.fs-20 {{ title }}
    slot(name="start")
  .right
    slot(name="end")
</template>

<script>
export default {
  name: 'WalletFarmHeader',
  props: ['title', 'hasSearch'],
}
</script>

<style scoped lang="scss">
.wallet-farm-header {
  display: flex;
  justify-content: space-between;
  .left {
    display: flex;
    align-items: center;
    gap: 18px;
  }
  .title {
    font-weight: bold;
  }
}
</style>
