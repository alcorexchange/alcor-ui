<template lang="pug">
.page-header.d-flex.align-items-center.pb-2
  ReturnLink.start.fs-20
  slot
    span.title {{ title }}
    slot(name='afterTitile')
  .end
    .d-flex.gap-2.align-items-center
      slot(name='end')
</template>

<script>
import ReturnLink from '@/components/ReturnLink'
import AlcorButton from '~/components/AlcorButton'
export default {
  name: 'AMMPageHeader',

  components: {
    ReturnLink,
    AlcorButton
  },

  props: ['title'],
}
</script>

<style scoped lang="scss">
.page-header {
  --border-1-color: rgba(60, 60, 67, 0.36);
  border-bottom: 1px solid var(--border-1-color);
  gap: 8px;
  .start, .end {
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
