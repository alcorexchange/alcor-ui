<template lang="pug">
.incentive-item
  .incentive-content
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
        template(v-for="stat in incentive.incentiveStats")
          tr()
            td
              .d-flex.flex-column
                .icon-and-value
                  span {{ parseFloat(stat.position.amountA) | nFormat }}
                  span.color-grey-thirdly {{ stat.position.amountA.split(' ')[1] }}
                .icon-and-value
                  span {{ parseFloat(stat.position.amountB) | nFormat }}
                  span.color-grey-thirdly {{ stat.position.amountB.split(' ')[1] }}
            td {{ stat.userSharePercent }}%
            td
              .icon-and-value
                //- TokenImage(:src="$tokenLogo(incentive.reward.quantity.split(' ')[1], incentive.reward.contract)" width="14px" height="14px")
                span {{ stat.dailyRewards.split(' ')[0] }}
                span.color-grey-thirdly {{ stat.dailyRewards.split(' ')[1] }}
            td
              .icon-and-value
                //- TokenImage(:src="$tokenLogo(incentive.reward.quantity.split(' ')[1], incentive.reward.contract)" width="14px" height="14px")
                span {{ stat.farmedReward.split(' ')[0] | commaFloat }}
                span.color-grey-thirdly {{ stat.farmedReward.split(' ')[1] }}
            td
              .d-flex.flex-column.gap-2
                NuxtLink.position-link(:to="localeRoute(`/positions/${stat.posId}`)") \#{{ stat.posId }}
                //TODO span Pool Share {{ stat.userSharePercent }}%
            td
              span action
</template>

<script>
import TokenImage from '~/components/elements/TokenImage'
import AlcorButton from '~/components/AlcorButton'
export default {
  components: {
    TokenImage,
    AlcorButton,
  },
  props: ['incentive', 'finished'],
}
</script>

<style lang="scss" scoped>
.incentive-item {
  padding: 0 var(--amm-space-3);
}
.right {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
}

.incentive-content {
  overflow: auto;
  &::-webkit-scrollbar {
    height: 2px;
  }
  table {
    width: 100%;
    min-width: 800px;
    thead tr {
      border-bottom: 1px solid var(--border-1-color);
    }
    th,
    td {
      padding: 8px;
      border-bottom: none;

      &:first-child {
        padding-left: 0;
      }
      &:last-child {
        padding-right: 0;
      }
    }
    tr,
    td {
      background: transparent !important;
      &:hover {
        background: transparent !important;
      }
    }

    th {
      font-weight: 400;
      white-space: nowrap;
    }
  }
}

.position-link {
  color: var(--main-green);
  &:hover {
    opacity: 0.8;
  }
}

@media only screen and (max-width: 800px) {
  .right {
    flex-wrap: wrap;
    align-self: flex-end;
  }
}
@media only screen and (max-width: 600px) {
  .incentive-header {
    .left {
      gap: 4px;
    }
  }
}
</style>
