<template lang="pug">
.bridge-process
  el-collapse.default
    el-collapse-item(title="Bridge TX Process")
      .bridge-process-items.mt-2
        .bridge-process-item(v-for="item, i in processMOCK" :style="{ '--color': states[item.state].color }")
          .text {{ i + 1 }}. {{ item.name }}
          .icon
            i(:class="states[item.state].icon")
</template>

<script>
import AlcorContainer from '@/components/AlcorContainer'
export default {
  components: {
    AlcorContainer
  },

  props: [
    'process'
  ],

  data: () => ({
    states: {
      default: {
        color: 'var(--text-default)',
        icon: ''
      },
      pending: {
        color: 'var(--main-green)',
        icon: 'el-icon-loading'
      },
      done: {
        color: 'var(--main-green)',
        icon: 'el-icon-circle-check'
      },
      failed: {
        color: 'var(--main-red)',
        icon: 'el-icon-warning-outline'
      },
    },
    processMOCK: [
      { name: 'Submitting WAX transfer', state: 'default' }, // default | pending | done | failed
      { name: 'Waiting TX irreversibility', state: 'pending' },
      { name: 'Fetching Proof', state: 'done' },
      { name: 'Submitting request USDT in EOS', state: 'failed' },
    ]
  }),
}
</script>

<style scoped lang="scss">
.bridge-process {
  background: var(--selector-bg) !important;
  padding: 8px;
  border-radius: 6px;
  &::v-deep {
    // .el-collapse-item {
    // }
  }
  &-items {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  &-item {
    background: var(--background-color-third);
    color: var(--color);
    padding: 4px 6px;
    border-radius: 4px;
    display: flex;
    justify-content: space-between;
    gap: 2px;
    align-items: center;
    .icon {
      display: flex;
      align-items: center;
      i {
        font-size: 1.1rem;
        line-height: 0;
      }
    }
  }
}
</style>
