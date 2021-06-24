<template lang="pug">
.lp-card
    slot
</template>

<script>
export default {
  name: 'LPCard'
}
</script>
<style scoped lang="scss">
.lp-card {
  padding: 12px;
  border-radius: var(--radius-2);
  border: 1px solid var(--border-color);
}
</style>
