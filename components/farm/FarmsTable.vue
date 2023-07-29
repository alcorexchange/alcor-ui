<template lang="pug">
  el-table(:data="[0, 0, 0, 0]")
    el-table-column(label="Pair" min-width="100%")
      template(#default="")
        .token-container
          PairIcons(
            :token1="{contact: 'usdt.alcor', symbol: 'usdt'}"
            :token2="{contact: 'eosio.token', symbol: 'wax'}"
          )
          .token-container-info
            .token-names USDT/WAX
            .token-contracts.muted usdt.alcor/eosio.token
    el-table-column(label="Total Staked")
      template(#default="")
        .icon-and-value(v-for="x in 2")
          TokenImage(:src="$tokenLogo('usdt', 'usdt.alcor')" width="14px" height="14px")
          span 484.86K
    el-table-column(label="APR")
      template(#default="")
        .apr {{ `${38.14}%` }}
    el-table-column(label="Daily Rewards")
      template(#default="")
        .icon-and-value(v-for="x in 2")
          TokenImage(:src="$tokenLogo('usdt', 'usdt.alcor')" width="14px" height="14px")
          span 484.86K
    el-table-column(label="Remaining Time")
      template(#default="")
        .icon-and-value(v-for="x in 2")
          TokenImage(:src="$tokenLogo('usdt', 'usdt.alcor')" width="14px" height="14px")
          span 32 Days
    el-table-column(align="right")
      template(#default="")
        AlcorButton(access) Stake
    el-table-column(type="expand")
      div some expandable data
</template>

<script>
import PairIcons from '@/components/PairIcons'
import TokenImage from '~/components/elements/TokenImage'
import AlcorButton from '~/components/AlcorButton'
export default {
  name: 'FarmsTable',
  components: {
    PairIcons,
    TokenImage,
    AlcorButton,
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
</style>
