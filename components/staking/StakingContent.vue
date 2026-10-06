<template lang="pug">
.staking-content
  h1.pt-4
    span.symbol LSW
    |  - Alcor Liquid Staked Token

  p.muted The highest natural yield mechanism available for DeFi on Wax. By a lot.

  StakingFAQ.pt-4

</template>

<script>
import StakingFAQ from './StakingFAQ.vue'
export default {
  name: 'StakingContent',
  components: {
    StakingFAQ,
  },
}
</script>

<style scoped lang="scss">
.symbol {
  color: var(--main-action-green);
}
</style>
