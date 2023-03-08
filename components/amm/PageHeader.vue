<template lang="pug">
.page-header.d-flex.justify-content-between.align-items-center.pb-2
  ReturnLink.fs-20
  span.align-self-center.title {{ title }}
  slot(name='end')
    span
</template>

<script>
import ReturnLink from '@/components/ReturnLink'
export default {
  name: 'AMMPageHeader',
  props: ['title'],
  components: {
    ReturnLink
  }
}
</script>

<style scoped lang="scss">
.page-header {
  border-bottom: 1px solid var(--border-color);
  .title{
    font-weight: 500;
    font-size: 1.1rem;
  }
}
</style>
