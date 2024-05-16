<template lang="pug">
  .tag
    slot
</template>

<script>
export default {
  name: 'Tag',
}
</script>

<style scoped lang="scss">
.tag {
  border: var(--border-1);
  background: var(--bg-alter-2);
  font-size: 10px;
  line-height: 1;
  padding: 4px;
  border-radius: 4px;
  display: inline-flex;
}
</style>
