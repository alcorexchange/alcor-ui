<template lang="pug">
.analytics-breadcrumb
  .item Token
  i.el-icon-arrow-right
  .item(v-if="token") {{ token.symbol }} ({{ token.contract }})
  template(v-if="pair")
    i.el-icon-arrow-right
    .item {{ pair }}

</template>

<script>
import AlcorButton from '@/components/AlcorButton'
export default {
  name: 'AnalyticsHeader',
  components: {
    AlcorButton
  },
  props: ['token', 'pair'],
}
</script>

<style scoped lang="scss">
.analytics-breadcrumb {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 4px;
  color: var(--text-disable);
}
</style>
