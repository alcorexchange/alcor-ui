<template lang="pug">
.farm-item-expand-advanced
  IncentiveItem(v-for="incentive in farm.incentives" :incentive="incentive" :poolFee="farm.fee" :finished="finished" @stakeAll="" @claimAll="" @unstakeAll="")
    template(#actions="{ stat }")
      FarmsTableActions(:row="stat" :staked="stat.staked" :finished="finished" @stake="" @claim="" @unstake="")
  // TODO Make it separete computed to make it reactive
  // FIXME: MAY BE WE DO NOT NEED IT HERE
  //.incentive-item(v-for="incentive in userStakes")
</template>

<script>
import FarmsTableActions from '~/components/farm/FarmsTableActions'
import IncentiveItem from '~/components/farm/IncentiveItem.vue'
export default {
  name: 'FarmItemExpandAdvanced',
  props: ['farm', 'finished'],
  components: {
    FarmsTableActions,
    IncentiveItem,
  },
}
</script>

<style scoped lang="scss">
.farm-item-expand-advanced {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
</style>
