<template lang="pug">
.staking-content
  h1.pt-4
    | Stake
    span.symbol  WAX
    |  to earn
    span.symbol  LSW

  p.muted Choose how much you want to stake and earn rewards.

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

<style scoped lang="scss"></style>
