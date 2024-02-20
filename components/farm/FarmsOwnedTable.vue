<template lang="pug">
  el-table(:data="[0, 0, 0, 0]" class="farms-owned-table")
    el-table-column(label="Assets In Farm" min-width="100%")
      template(#default="")
        .token-container
          PairIcons(
            :token1="{contact: 'usdt.alcor', symbol: 'usdt'}"
            :token2="{contact: 'eosio.token', symbol: 'wax'}"
          )
          .token-container-info
            .token-names USDT/WAX
            .token-contracts.muted usdt.alcor/eosio.token
    el-table-column(label="Deposited for Distribution" minWidth="100%")
      template(#default="")
        .icon-and-value(v-for="x in 2")
          TokenImage(:src="$tokenLogo('usdt', 'usdt.alcor')" width="14px" height="14px")
          span 484.86K
    el-table-column(label="Daily Rewards")
      template(#default="")
        .icon-and-value(v-for="x in 2")
          TokenImage(:src="$tokenLogo('usdt', 'usdt.alcor')" width="14px" height="14px")
          span 484.86K
    el-table-column(label="APR")
      template(#default="")
        .apr {{ `${38.14}%` }}
    el-table-column(label="Remaining Time")
      template(#default="")
        .icon-and-value(v-for="x in 2")
          TokenImage(:src="$tokenLogo('usdt', 'usdt.alcor')" width="14px" height="14px")
          span 32 Days
    el-table-column(align="right")
      template(default="")
      .actions
        span.yellow ( You are the owner )
        span.add-rewards Add Rewards

</template>

<script>
import PairIcons from '@/components/PairIcons'
import TokenImage from '~/components/elements/TokenImage'
import AlcorButton from '~/components/AlcorButton'
import StakingStatus from '~/components/farm/StakingStatus.vue'
export default {
  name: 'FarmsOwnedTable',
  components: {
    PairIcons,
    TokenImage,
    AlcorButton,
    StakingStatus,
  },
}
</script>

<style scoped lang="scss">
.token-container {
  display: flex;
  gap: 12px;
  align-items: center;
}
.token-container-info {
  display: flex;
  flex-direction: column;
  // gap: 8px;
  .token-contracts {
    font-size: 0.8rem;
  }
}
.icon-and-value {
  display: flex;
  align-items: center;
  gap: 4px;
  span {
    font-size: 0.8rem;
  }
}

.actions {
  display: flex;
  flex-direction: column;
  .yellow {
    color: var(--main-yellow);
  }
  .add-rewards {
    color: var(--main-action-green);
    text-decoration: underline;
    cursor: pointer;
    &:hover {
      color: var(--main-green);
    }
  }
}
</style>
