<template lang="pug">
.incentive-item
  .incentive-header
    .left
      .key-value
        span.key.muted.fs-14 Daily Reward
        .icon-and-value
          TokenImage(:src="$tokenLogo(incentive.reward.quantity.split(' ')[1], incentive.reward.contract)" width="14px" height="14px")
          span {{ incentive.rewardPerDay | commaFloat(incentive.reward.symbol.precision) }} {{ incentive.reward.symbol.symbol }}
      span.muted •
      .key-value
        //- span.muted Remaining Time
        span.fs-14 {{ incentive.daysRemain }} Days
    .right(v-if="incentive.incentiveStats.length > 0")
      AlcorButton(access compact @click="$emit('claimAll', incentive)" v-if="!finished").farm-claim-button Claim All
      AlcorButton(access bordered compact @click="$emit('stakeAll', incentive)" v-if="!finished").farm-stake-button Stake All
      AlcorButton(:class="finished ? 'access' : 'danger bordered'" compact @click="$emit('unstakeAll', incentive)").farm-unstake-button {{ finished ? 'Claim & Unstake All' : 'Unstake All' }}
  .incentive-content
    table.fs-14
      thead
        tr
          th Position ID
          th Pool Share
          th Estimated Daily Reward
          th Farmed Reward
          th
      tbody
        template(v-for="stat in incentive.incentiveStats")
          tr(v-if="stat.staked")
            td
              NuxtLink(:to="localeRoute(`/positions/${stat.posId}`)") # {{ stat.posId }}
            td {{ stat.userSharePercent }}%
            td
              .icon-and-value
                TokenImage(:src="$tokenLogo(incentive.reward.quantity.split(' ')[1], incentive.reward.contract)" width="14px" height="14px")
                span {{ stat.dailyRewards }}
            td
              .icon-and-value
                TokenImage(:src="$tokenLogo(incentive.reward.quantity.split(' ')[1], incentive.reward.contract)" width="14px" height="14px")
                span {{ stat.farmedReward | commaFloat }}
            td
              slot(name="actions" :stat="stat")
          tr(v-else)
            td
              NuxtLink(:to="localeRoute(`/positions/${stat.posId}`)") # {{ stat.posId }}
            td Not Staked
            td
            td
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
  props: ['incentive', 'finished', 'poolFee'],
}
</script>

<style lang="scss" scoped>
.incentive-item {
  padding: var(--amm-space-3);
}

.incentive-header {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  padding-bottom: var(--amm-space-3);
  .left {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .right {
    display: flex;
    align-items: center;
    gap: 4px;
  }
}

.incentive-content {
  overflow: auto;
  table {
    width: 100%;
    min-width: 600px;
    th,
    td {
      padding: 2px 6px;
      border-bottom: none;
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

.key-value {
  display: flex;
  align-items: center;
  gap: 8px;
}

.icon-and-value {
  display: flex;
  align-items: center;
  gap: 4px;
  span {
    font-size: 0.8rem;
  }
}

.farm-stake-button::v-deep {
  color: var(--main-action-green) !important;
  &:hover {
    background: var(--main-action-green) !important;
    color: black !important;
  }
}
.farm-unstake-button::v-deep {
  color: var(--main-action-red);
  &:hover {
    background: var(--main-action-red) !important;
    color: black !important;
  }
}
.farm-claim-button::v-deep {
  color: var(--text-theme) !important;
  &:hover {
    background: var(--main-green) !important;
  }
}

@media only screen and (max-width: 800px) {
  .incentive-header {
    flex-direction: column;
    .right {
      flex-wrap: wrap;
      align-self: flex-end;
    }
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
