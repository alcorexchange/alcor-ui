<template lang="pug">
.page-header.d-flex.align-items-center.pb-2
  ReturnLink.start.fs-20
  span.title {{ title }}
  .end
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
  gap: 8px;
  > * {
    flex: 1;
  }
  .end {
    display: flex;
    justify-content: flex-end;
  }
  .title{
    font-weight: 500;
    font-size: 1.1rem;
    display: flex;
    justify-content: center;
  }
}
.action::v-deep, .settings::v-deep .action {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  padding: 0;
}
@media only screen and (max-width: 380px){
  .page-header{
    .start{
      flex: initial;
    }
    .title{
      justify-content: start;
    }
  }
}
</style>
