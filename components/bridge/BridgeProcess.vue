<template lang="pug">
.bridge-process
  el-collapse
    el-collapse-item(title="Bridge TX Process")
      .bridge-process-items
        .bridge-process-item(v-for="item, i in processMOCK" :style="{ '--color': states[item.state].color }")
          .text {{ i + 1 }}. {{ item.name }}
          .icon
            i(:class="states[item.state].icon")
</template>

<script>
export default {
  components: {
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

  &-items {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  &-item {
    color: var(--color);
    padding: 6px;
    border-radius: 4px;
    background: var(--background-color-base);
    display: flex;
    justify-content: space-between;
    gap: 4px;
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
