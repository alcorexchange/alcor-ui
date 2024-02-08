<template lang="pug">
nuxt-link(to="/" :style="renderStyle").layout-menu-content-item
  .icon
    img(:src="icon")
  .content
    .title {{ title }}
    .description.fs-12 {{ description }}
</template>

<script>
export default {
  name: 'LayoutContentItem',
  props: ['title', 'description', 'icon', 'isSocial', 'isExternal'],
  computed: {
    renderTag() {
      return this.isExternal ? 'a' : 'nuxt-link'
    },
    renderStyle() {
      return this.isSocial ? { '--hover-rgb': '55, 174, 226' } : { '--hover-rgb': '50, 215, 75' }
    },
  },
}
</script>

<style scoped lang="scss">
.layout-menu-content-item {
  display: flex;
  align-items: center;
  color: var(--text-default);
  gap: 24px;
  padding: 8px;
  border-radius: var(--radius-2);
  .icon {
    img {
      width: 32px;
      height: 32px;
    }
  }
  .content {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  &:hover {
    // TODO: Add transition for background
    background: linear-gradient(to bottom, rgba(var(--hover-rgb), 0.12), rgba(var(--hover-rgb), 0.04));
  }
}
</style>
