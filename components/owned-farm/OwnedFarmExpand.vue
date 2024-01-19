<template lang="pug">
.owned-farm-expand
  table.fs-14
    thead
      tr
        th #
        th Reward
        th Status
        th Last Update
        th Stakes
        th Duration (d.)
        th Remaining (d.)
        th Daily Reward (d.)
        th
    tbody
      template(v-for="incentive in farm.incentives")
        tr()
          td {{ incentive.id }}
          td
            //- .d-flex.flex-column
            //-   .icon-and-value
            //-     span {{ parseFloat(stat.position.amountA) | nFormat }}
            //-     span.color-grey-thirdly {{ stat.position.amountA.split(' ')[1] }}
            //-   .icon-and-value
            //-     span {{ parseFloat(stat.position.amountB) | nFormat }}
            //-     span.color-grey-thirdly {{ stat.position.amountB.split(' ')[1] }}
          td
          td {{ incentive.isFinished ? 'Finished' : 'Active' }}
          td {{ incentive.lastUpdateTime | moment('YYYY-MM-DD HH:mm') }}
          td {{ incentive.numberOfStakes }}
          td {{ incentive.durationInDays }}
          td {{ incentive.daysRemain }}
          td {{ incentive.rewardPerDay }}
          td
            span action
</template>

<script>
import OwnedIncentiveItem from '~/components/owned-farm/OwnedIncentiveItem.vue'
export default {
  name: 'OwnedFarmExpand',

  components: {
    OwnedIncentiveItem,
  },

  props: ['farm'],
}
</script>

<style scoped lang="scss">
.owned-farm-expand {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
</style>
