<template>
  <div class="wallet-name">
    <i class="el-icon-wallet"></i>
    <div class="name">
      aw.aq.waa
    </div>
    <div class="actions">
      <i class="el-icon-copy-document"></i>
    </div>
  </div>
</template>

<script>
export default {
  name: 'WalletName'
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
