<template lang="pug">
.staking-content
  h1.pt-4
    | Stake
    span.symbol  WAX
    |  to earn
    span.symbol  LSW

  p.muted Choose how much you want to stake and earn rewards.

  //- .stats.mt-3
  //-   .stat-container
  //-     .stat-title.muted Rate
  //-     .stat-value {{ rate }} WAX per LSW
  //-   .stat-container
  //-     .stat-title.muted APR
  //-     .stat-value {{ apr }}%
  //-   .stat-container
  //-     .stat-title.muted
  //-       div TVL &nbsp;
  //-       div.muted.small ( {{ $systemToUSD(tvl) }}$ )
  //-     .stat-value {{ tvl }}

  //- .stat-container.mt-3(v-if="stakeTokenBalance")
  //-   .stat-title.muted Current Stake Balance
  //-   .stat-value {{ stakeTokenBalance.amount }} {{ stakeTokenBalance.symbol }}
</template>

<script>
export default {
  name: 'StakingContent',
  props: ['rate', 'apr', 'stakeTokenBalance', 'tvl'],
}
</script>

<style scoped lang="scss">
.stats {
  display: grid;
  gap: 20px;
  grid-template-columns: 1fr 1fr;
}
.stat-container {
  box-shadow: 0 0 0 1px var(--bg-alter-2);
  border-radius: 6px;
  padding: 8px 12px;
  display: flex;
  flex-direction: column;
  flex: 1;
  justify-content: space-between;
  // background: var(--background-color-base);
  .stat-title {
    font-size: 16px;
    display: flex;
    align-items: center;
  }
  .stat-value {
    font-size: 24px;
    font-weight: bold;
  }
}
</style>
