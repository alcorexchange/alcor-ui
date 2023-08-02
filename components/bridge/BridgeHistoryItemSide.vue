<template lang="pug">
.side
  .network-and-label
    span.label.fs-12.mr-1 {{ label }}
    img(:src="require(`~/assets/icons/${'wax'}.png`)").network-img
    span.network-name.fs-12 WAX
  .token-container
    img.token-img(:src="require(`~/assets/icons/${'matic'}.png`)")
    span.token-amount 5,000 USDT
  .tx-link.fs-12
    a.tx-link-inner.pointer
      i.el-icon-link
      | &nbsp;
      span TX Link
</template>

<script>
export default {
  props: ['label']
}
</script>

<style scoped lang="scss">
.side {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.network-and-label {
  display: flex;
  align-items: center;
  gap: 6px;
}
.network-img {
  width: 14px;
}
.token-container {
  display: flex;
  align-items: center;
  gap: 8px;
  .token-img {
    width: 18px;
  }
}
.tx-link-inner {
  text-decoration: underline !important;
}
.label, .tx-link-inner {
  color: var(--text-grey-thirdly);
}
</style>
