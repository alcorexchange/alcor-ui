<template lang="pug">
</template>

<script>
export default {
  name: 'SwapBackground',
}
</script>

<style scoped lang="scss">
.swap-background {
  background: radial-gradient(circle at 50% 20%, var(--swap-color) 0%, transparent 40%);
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0.06;
}
</style>
