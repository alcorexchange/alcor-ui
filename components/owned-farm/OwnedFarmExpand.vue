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
            .icon-and-value
              TokenImage(:src="$tokenLogo(incentive.reward.quantity.split(' ')[1], incentive.reward.contract)" width="14px" height="14px")
              span {{ incentive.reward.quantity.split(' ')[0] | nFormat(incentive.reward.symbol.precision) }}
              span.color-grey-thirdly {{ incentive.reward.quantity.split(' ')[1] }}
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
import TokenImage from '~/components/elements/TokenImage'

export default {
  name: 'OwnedFarmExpand',

  components: {
    OwnedIncentiveItem,
    TokenImage,
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
