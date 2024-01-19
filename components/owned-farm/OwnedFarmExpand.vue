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
          td {{ incentive.isFinished ? 'Finished' : 'Active' }}
          td {{ incentive.lastUpdateTime | moment('YYYY-MM-DD HH:mm') }}
          td {{ incentive.numberOfStakes }}
          td {{ incentive.durationInDays }}
          td {{ incentive.daysRemain }}
          td {{ incentive.rewardPerDay }}
          td
            .action
              AlcorButton(@click="$emit('extend', incentive)" access) Extend
</template>

<script>
import TokenImage from '~/components/elements/TokenImage'
import AlcorButton from '~/components/AlcorButton'

export default {
  name: 'OwnedFarmExpand',

  components: {
    TokenImage,
    AlcorButton,
  },

  props: ['farm'],
}
</script>

<style scoped lang="scss">
.owned-farm-expand {
  min-width: 100%;
  table {
    width: 100%;
    td {
      padding: 4px 2px;
    }
  }
}
.action {
  display: flex;
  justify-content: flex-end;
}
</style>
