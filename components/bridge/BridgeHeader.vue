<template lang="pug">
.d-flex.align-items-center.gap-16.p-1
  NuxtLink.item(:to="localeRoute('/bridge_new')" exact).fs-18 Bridge
  .history-item-container
    NuxtLink.item(:to="localeRoute('/bridge_new/history')").fs-18 History
    .pending-count 1
</template>

<script>
export default {
  name: 'BridgeHeader',
}
</script>

<style lang="scss">
.item {
  color: var(--text-disable);
  &:hover {
    color: var(--text-default);
  }
}
.active {
  color: var(--text-default);
}

.history-item-container {
  display: flex;
  align-items: center;
  gap: 4px;
  .pending-count {
    padding: 2px 6px;
    line-height: 1.2;
    background: #ff2d55;
    border-radius: 24px;
    font-size: 0.8rem;
  }
}
</style>
