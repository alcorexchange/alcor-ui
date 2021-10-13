<template lang="pug">
.pointer
  el-tooltip.item(effect='dark' placement='top-start')
    template(slot="content")
      span.title.muted Maker Fee
      span.value  {{ (meta.fee / 100).toFixed(4) }}%
      span.title.muted.ml-2 Taker Fee
      span.value  {{ (meta.fee / 100).toFixed(4) }}%
    small.muted % Fee Rate

  //el-dropdown(placement="top").fee-rate
    AlcorButton(flat) Fee Rate
    el-dropdown-menu(slot="dropdown").dropdown-content
</template>

<script>
import { mapGetters } from 'vuex'
import AlcorButton from '@/components/AlcorButton.vue'

export default {
  name: 'FeeRate',
  components: {
    AlcorButton
  },

  computed: {
    ...mapGetters('market', ['meta'])
  }
}
</script>

<style scoped lang="scss">
.dropdown-content {
  display: flex;
  padding: 8px;
}
.item {
  display: flex;
  align-items: center;
  .title {
    padding-right: 2px;
  }
}
.h-spacer {
  width: 1px;
  background: var(--background-color-secondary);
  margin: 0 8px;
}
</style>
