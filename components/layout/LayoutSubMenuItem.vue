<template lang="pug">
.layout-sub-menu-item
  .icon
  .content
    .title {{ title }}
    .description.fs-12 {{ description }}
</template>

<script>
export default {
  name: 'LayoutSubMenuItem',
  props: ['title', 'description', 'icon'],
}
</script>

<style scoped lang="scss">
.layout-sub-menu-item {
  display: flex;
  align-items: center;
  .content {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
}
</style>
