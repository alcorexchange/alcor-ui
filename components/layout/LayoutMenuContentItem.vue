<template lang="pug">
.layout-sub-menu-item
  .icon
    img(:src="icon")
  .content
    .title {{ title }}
    .description.fs-12 {{ description }}
</template>

<script>
export default {
  name: 'LayoutContentItem',
  props: ['title', 'description', 'icon'],
}
</script>

<style scoped lang="scss">
.layout-sub-menu-item {
  display: flex;
  align-items: center;
  .icon {
    img {
      width: 32px;
      height: 32px;
    }
  }
  .content {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
}
</style>
