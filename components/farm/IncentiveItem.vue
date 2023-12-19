<template lang="pug">
.incentive-item
  .incentive-content
    table.fs-14
      thead
        tr
          th Your Stake
          th Reward Share
          th Daily Earn
          th Total Earned
          th Pool Position
          th
            .right(v-if="incentive.incentiveStats.length > 0")
              AlcorButton(access compact @click="$emit('claimAll', incentive)" v-if="!finished").farm-claim-button Claim All
              AlcorButton(compact @click="$emit('stakeAll', incentive)" v-if="!finished").farm-stake-button Stake All
              AlcorButton(:class="finished ? 'access' : 'danger bordered'" compact @click="$emit('unstakeAll', incentive)").farm-unstake-button {{ finished ? 'Claim & Unstake All' : 'Unstake All' }}
      tbody
        template(v-for="stat in incentive.incentiveStats")
          tr(v-if="stat.staked")
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
              slot(name="actions" :stat="stat")
          tr(v-else)
            td
              .d-flex.flex-column
                .icon-and-value
                  span {{ parseFloat(stat.position.amountA) | nFormat }}
                  span.color-grey-thirdly {{ stat.position.amountA.split(' ')[1] }}
                .icon-and-value
                  span {{ parseFloat(stat.position.amountB) | nFormat }}
                  span.color-grey-thirdly {{ stat.position.amountB.split(' ')[1] }}
            td Not Staked
            td
            td
            td
              NuxtLink.position-link(:to="localeRoute(`/positions/${stat.posId}`)") # {{ stat.posId }}
            td
              slot(name="actions" :stat="stat")
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
