<template lang="pug">
.incentive-item
  .incentive-header
    .left
      .key-value
        span.key.muted Daily Reward
        .icon-and-value
          TokenImage(:src="$tokenLogo(incentive.reward.quantity.split(' ')[1], incentive.reward.contract)" width="14px" height="14px")
          span {{ incentive.rewardPerDay }} {{ incentive.reward.quantity.split(' ')[1] }}
      span.muted •
      .key-value
        //- span.muted Remaining Time
        span {{ incentive.daysRemain }} Days
    .right(v-if="incentive.incentiveStats.length > 0")
      AlcorButton(access compact @click="$emit('claimAll', incentive)" v-if="!finished") Claim All Rewards
      AlcorButton(access bordered compact @click="$emit('stakeAll', incentive)" v-if="!finished").stake-button Stake All
      AlcorButton(:class="finished ? 'access' : 'danger bordered'" compact @click="$emit('unstakeAll', incentive)") {{ finished ? 'Claim & Unstake All' : 'Unstake All' }}
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
              NuxtLink(:to="localeRoute(`/positions/${stat.pool}-${stat.posId}-${poolFee}`)") # {{ stat.posId }}
            td {{ stat.userSharePercent }}%
            td
              .icon-and-value
                TokenImage(:src="$tokenLogo(incentive.reward.quantity.split(' ')[1], incentive.reward.contract)" width="14px" height="14px")
                span {{ stat.dailyRewards }}
            td
              .icon-and-value
                TokenImage(:src="$tokenLogo(incentive.reward.quantity.split(' ')[1], incentive.reward.contract)" width="14px" height="14px")
                span {{ stat.farmedReward }}
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
  border-radius: var(--radius);
  padding: var(--amm-space-3);
  border: 1px solid var(--light-border-color);
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
    // ::v-deep {
    //   .access {
    //     color: var(--main-green) !important;
    //   }
    // }
  }
}
.stake-button {
  color: var(--main-action-green) !important;
  &:hover {
    background: var(--main-action-green) !important;
    color: black !important;
  }
}

.incentive-content {
  table {
    width: 100%;
    th,
    td {
      padding: 2px 0;
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
</style>
