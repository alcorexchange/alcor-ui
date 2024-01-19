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
        th Duration ( Days )
        th Remaining ( Days )
        th Daily Reward
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
  padding: 8px;
  min-width: 100%;
  overflow-y: auto;
  &::-webkit-scrollbar {
    height: 2px;
  }
  table {
    width: 100%;
    min-width: 900px;
    td {
      padding: 4px 2px;
    }
    th {
      padding-bottom: 4px;
      font-weight: 400;
    }
  }
}
.action {
  display: flex;
  justify-content: flex-end;
}
</style>
