<template lang="pug">
.page-header.d-flex.align-items-center.pb-2
  .start
    ReturnLink.fs-20
  span.title {{ title }}
  .end
    slot(name='end')
      .d-flex.gap-2.align-items-center
        Settings
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
  --border-1-color: rgba(60, 60, 67, 0.36);
  border-bottom: 1px solid var(--border-1-color);
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
    white-space: nowrap;
  }
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
