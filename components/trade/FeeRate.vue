<template lang="pug">
  el-dropdown(placement="top").fee-rate
    AlcorButton(flat) Fee Rate
    el-dropdown-menu(slot="dropdown").dropdown-content
        .item
          span.title.muted Maker Fee
          span.value 10%
        .h-spacer
        .item
          span.title.muted Taker Fee
          span.value 10%
</template>

<script>
import AlcorButton from '@/components/AlcorButton.vue'
export default {
  name: 'FeeRate',
  components: {
    AlcorButton
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
