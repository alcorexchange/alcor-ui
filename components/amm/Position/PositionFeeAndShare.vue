<template lang="pug">
.position-fee-and-share.d-flex.flex-column.gap-2.fs-14
  .item.d-flex.justify-content-between
    .title.disable Estimated Fees (24h)
    .value $12,010
  .item.d-flex.justify-content-between
    .title.disable Current Pool Share
    .value 0 %
</template>

<script>
export default {

}
</script>

<style scoped lang="scss">
.position-fee-and-share {
  margin-top: var(--amm-space-2);
}
</style>
