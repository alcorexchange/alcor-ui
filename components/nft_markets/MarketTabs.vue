<template lang="pug">
.market-tabs
  .tab(v-for="[key, name] in Object.entries(tabs)" @click="$emit('change', key)" :class="{ active: key === value }") {{ name }}
</template>

<script>
export default {
  props: ['tabs', 'value']
}
</script>

<style lang="scss" scoped>
.market-tabs {
  display: flex;
  gap: 30px;
  width: 100%;

  .tab {
    width: 100%;
    cursor: pointer;
    padding: 5px;
    font-size: 18px;
    text-align: center;
    border-bottom: 1px solid #333;

    &.active {
      border-bottom: 1px solid var(--main-green);
    }
  }
}
</style>
