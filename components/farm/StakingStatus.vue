<template lang="pug">
.stacking-status
  .the-dot
  span Staking
</template>

<script>
export default {
  name: 'StakingStatus',
}
</script>

<style scoped lang="scss">
.stacking-status {
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--main-green);
}
.the-dot {
  background: var(--main-green);
  width: 4px;
  height: 4px;
  border-radius: 4px;
  animation: slow-blink 3s linear infinite;
}

@keyframes slow-blink {
  0% {
    opacity: 1;
  }
  40% {
    opacity: 0;
  }
  70% {
    opacity: 1;
  }
  100% {
    opacity: 1;
  }
}
</style>
