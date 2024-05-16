<template lang="pug">
  .mobile-footer-section
    .header.pointer( @click="open = !open")
      span.title {{ section.title }}
      .icon
        i.el-icon-minus(v-if="open")
        i.el-icon-plus(v-else)
    .content(v-if="open")
      component(v-for="item in section.items" :is="item.to ? 'nuxt-link' : 'a'" class="footer-link" v-bind="item.to ? { to: localePath(item.to) } : { href: item.href }" :target="item.href ? '_blank' : undefined") {{ item.title }}
</template>

<script>
export default {
  name: 'MobileFooter',
  props: ['section'],

  data: () => ({
    open: false,
  }),

  computed: {},
}
</script>

<style scoped lang="scss">
.header {
  padding: 8px;
  display: flex;
  justify-content: space-between;
  color: var(--text-disable);
  transition: color 0.2s;
  font-weight: bold;
  &:hover {
    color: var(--text-default);
  }
}

.content {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px 16px;
  padding-bottom: 16px;
}
.footer-link {
  color: var(--text-disable);
  transition: color 0.2s;
  cursor: pointer;
  &:hover {
    color: var(--text-default);
  }
}
</style>
