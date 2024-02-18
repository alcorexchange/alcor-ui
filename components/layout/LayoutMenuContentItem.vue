<template lang="pug">
component.layout-menu-content-item(:is="renderTag" v-bind="linkAttrs" :style="renderStyle")
  .icon
    img(:src="icon")
  .content
    .title {{ title }}
    .description.fs-12.muted {{ description }}
</template>

<script>
export default {
  name: 'LayoutContentItem',
  props: ['title', 'description', 'icon', 'social', 'to', 'href', 'target'],
  computed: {
    renderTag() {
      return this.to ? 'nuxt-link' : 'a'
    },
    renderStyle() {
      return `--hover-rgb: ${this.social ? '55, 174, 226' : '50, 215, 75'}`
    },
    linkAttrs() {
      return this.to ? { to: this.localePath(this.to) } : { href: this.href, target: '_blank' }
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
  padding: 8px 16px;
  border-radius: var(--radius-2);
  cursor: pointer;
  transition: background 0.2s;
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
    background: var(--hover);
  }
  &.active {
    background: var(--btn-active);
  }
}
</style>
