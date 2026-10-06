<template lang="pug">
.staking-tabs
  .item(:class="{active: value === 'stake'}" @click="updateActiveTab('stake')") Stake
  .item(:class="{active: value === 'unstake'}" @click="updateActiveTab('unstake')") Unstake
</template>

<script>
export default {
  name: 'StakingTabs',
  props: ['value'], // stake, unstake
  data: () => ({}),

  computed: {},

  methods: {
    updateActiveTab(tab) {
      this.$emit('input', tab)
    },
  },
}
</script>

<style scoped lang="scss">
.staking-tabs {
  display: flex;
  padding: 4px;
  background: var(--background-color-base);
  border-radius: 6px;
  // box-shadow: 0 0 0 1px var(--btn-active);
  .item {
    user-select: none;
    transition: all 0.2s;
    padding: 6px 8px;
    flex: 1;
    border-radius: 6px;
    display: flex;
    justify-content: center;
    text-align: center;
    cursor: pointer;
    &:hover {
      color: var(--text-disable);
    }
    &.active {
      color: var(--text-default);
      background: var(--btn-active);
    }
  }
}
</style>
