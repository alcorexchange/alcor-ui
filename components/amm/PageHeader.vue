<template lang="pug">
.page-header.d-flex.justify-content-between.align-items-center.pb-2
  ReturnLink.fs-20
  span.align-self-center.title {{ title }}
  slot(name='end')
    .d-flex.gap-4.align-items-center
      AlcorButton.action(iconOnly flat)
        i.el-icon-refresh.pointer.fs-18(@click="$emit('refresh')")
      Settings.settings
</template>

<script>
import ReturnLink from '@/components/ReturnLink'
import Settings from '~/components/amm/Settings'
import AlcorButton from '~/components/AlcorButton'
export default {
  name: 'AMMPageHeader',
  props: ['title'],
  components: {
    ReturnLink,
    Settings,
    AlcorButton
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
.action::v-deep, .settings::v-deep .action {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  padding: 0;
}
</style>
