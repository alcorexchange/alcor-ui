<template lang="pug">
.farm-header-container
  .farm-header
    .left
      el-input(v-model="search" class="farms-search-input" placeholder="Search Tokens" size="medium" prefix-icon='el-icon-search' clearable)
      AlcorSwitch.alcor-switch(
        v-if="!hideStakedOnly"
        one="Active"
        two="Finished"
        :active="finished ? 'two' : 'one'"
        @toggle="toggle"
      )

      el-switch.farm-switch(
        active-color="var(--main-action-green)"
        active-text="Staked Only"
        :value="$store.state.farms.stakedOnly"
        @change="$store.commit('farms/setStakedOnly', $event)"
      )

      //- el-switch.farm-switch(
      //-   active-color="var(--main-action-green)"
      //-   active-text="Advanced Mode"
      //-   :value="$store.state.farms.view === 'ADVANCED'"
      //-   @change="$store.commit('farms/toggleView')"
      //- )

    .right
      el-popover(trigger="click" placement="bottom" v-model="advancedSettingActive")
        template(#reference)
          AlcorButton(iconOnly)
            i.el-icon-s-tools
        .advanced-mode-container
          span View Mode
          div(v-if="advancedSettingActive")
            AlcorSwitch.alcor-switch(
              one="Simple View"
              two="Advanced View"
              :active="$store.state.farms.view === 'ADVANCED' ? 'two' : 'one'"
              @toggle="$store.commit('farms/toggleView')"
            )

          .mt-2
            el-checkbox(v-model="hideZeroAPR") Hide zero APR farms
      AlcorButton(@click="$router.push('/farm/create')") Create farm
      el-badge.header-action-badge(v-if="finished && stakedStakes.length != 0" type="success" :value="stakedStakes.length")
        el-tooltip(content="Unstake your finished farms to free account RAM")
          AlcorButton.pulse-animation(@click="unstakeAllFarms") Claim & Unstake All
      el-badge.header-action-badge(v-if="!finished && unstakedStakes.length != 0" type="warning" :value="unstakedStakes.length")
        AlcorButton.pulse-animation(@click="stakeAllFarms") Stake All Positions
      el-badge(v-if="noneFinishedStakes.length && !finished" type="success"  :value="noneFinishedStakes.length")
        el-tooltip(v-model="showTotal")
          AlcorButton.farm-claim-button(access @click="claimTotal") Claim All Rewards
          template(#content)
            .mb-2 Total Rewards
            .farm-total-rewards
              .reward(v-for="reward in totalRewards")
                TokenImage.icon(:src="$tokenLogo(reward.symbol, reward.contract)" height="16" width="16")
                .d-flex.gap-4
                  span {{ reward.amount }}
                  span.muted {{ reward.symbol }}
      //- el-badge(v-if="finished && stakedStakes.length != 0" type="success" :value="stakedStakes.length")
      //-   el-tooltip(content="Unstake your finished farms to free account RAM")
      //-     GradientBorder.gradient-border
      //-       AlcorButton(@click="unstakeAll") Claim & Unstake All

      //- el-badge(v-if="!finished && unstakedStakes.length != 0 && !hideStakeAll" type="warning" :value="unstakedStakes.length")
      //-   GradientBorder.gradient-border
      //-     AlcorButton(@click="stakeAll") Stake All Positions
    //- .right
</template>

<script>
import AlcorSwitch from '@/components/AlcorSwitch'
import AlcorLink from '@/components/AlcorLink'
import AlcorButton from '@/components/AlcorButton'
import GradientBorder from '@/components/alcor-element/GradientBorder'
import TokenImage from '~/components/elements/TokenImage'
import { calculateUserStake } from '~/utils/farms.ts'
export default {
  name: 'FarmHeader',

  components: {
    AlcorSwitch,
    AlcorLink,
    AlcorButton,
    GradientBorder,
    TokenImage,
  },

  props: ['finished', 'stakedOnly', 'hideStakedOnly', 'hideStakeAll'],

  data: () => {
    return {
      search: '',
      // this data is added to hide the AlcorSwitch component when closed, the popover keeps the content in render causing width calculations of switch not work.
      interval: null,
      showTotal: false,
      totalRewards: [],
      advancedSettingActive: false,
    }
  },

  computed: {
    hideZeroAPR: {
      set(val) {
        this.$store.commit('farms/setHideZeroAPR', val)
      },

      get() {
        return this.$store.state.farms.hideZeroAPR
      },
    },

    // The finished stakes that should be unstaked
    stakedStakes() {
      const stakes = []
      this.$store.getters['farms/farmPools']
        // pools
        .forEach((p) =>
          p.incentives
            .filter((i) => i.isFinished && i.stakeStatus != 'notStaked' && i.incentiveStats.length > 0)
            //incentives
            .forEach((i) =>
              i.incentiveStats
                .filter((i) => i.staked)
                // staked stats
                .forEach((s) => stakes.push(s))
            )
        )

      return stakes
    },

    // None finished incentives that should be staked
    unstakedStakes() {
      const stakes = []
      this.$store.getters['farms/farmPools']
        // pools
        .forEach((p) =>
          p.incentives
            .filter((i) => !i.isFinished && i.stakeStatus != 'staked' && i.incentiveStats.length > 0)
            //incentives
            .forEach((i) =>
              i.incentiveStats
                .filter((i) => !i.staked && i.position.inRange)
                // staked stats
                .forEach((s) => stakes.push(s))
            )
        )

      return stakes
    },

    // None finished stakes that can be claimed
    noneFinishedStakes() {
      const stakes = []

      this.$store.getters['farms/farmPools'].forEach((pool) => {
        pool.incentives
          .filter((incentive) => !incentive.isFinished && incentive.stakeStatus != 'notStaked')
          .forEach((incentive) => {
            incentive.incentiveStats.filter((s) => s.staked).forEach((s) => stakes.push(s))
          })
      })

      return stakes
    },
  },

  watch: {
    search(val) {
      this.$emit('update:search', val)
    },

    showTotal(open) {
      if (open) {
        this.setTotalRewards()
        this.interval = setInterval(() => this.setTotalRewards(), 1000)
      } else {
        clearInterval(this.interval)
      }
    }
  },

  methods: {
    setTotalRewards() {
      const reward = {}

      const precisions = {}

      this.$store.getters['farms/farmPools'].forEach((farm) => {
        farm.incentives
          .filter((i) => !i.isFinished)
          .forEach((incentive) => {
            incentive.incentiveStats
              .filter((s) => s.staked)
              .forEach((s) => {
                const staked = calculateUserStake(s)

                const symbol = staked.farmedReward.symbol.name
                const amount = staked.farmedReward

                precisions[symbol] = staked.farmedReward.symbol.precision

                if (reward[symbol]) {
                  reward[symbol].amount = reward[symbol].amount + parseFloat(amount)
                } else {
                  reward[symbol] = {
                    symbol,
                    amount: parseFloat(amount),
                    precision: precisions[symbol],
                    contract: incentive.reward.contract,
                  }
                }
              })
          })
      })

      this.totalRewards = Object.values(reward).map((r) => {
        return {
          ...r,
          amount: r.amount?.toFixed(r.precision),
        }
      })
    },

    async claimTotal() {
      const stakes = this.noneFinishedStakes
      try {
        await this.$store.dispatch('farms/stakeAction', {
          stakes,
          action: 'getreward',
        })
        setTimeout(() => this.$store.dispatch('farms/updateStakesAfterAction'), 500)
      } catch (e) {
        this.$notify({
          title: 'Error',
          message: e.message || e,
          type: 'error',
        })
      }
    },

    toggle() {
      this.$emit('update:finished', !this.finished)
    },

    async unstakeAllFarms() {
      try {
        await this.$store.dispatch('farms/stakeAction', {
          stakes: this.stakedStakes,
          action: 'unstake',
        })
        setTimeout(() => this.$store.dispatch('farms/updateStakesAfterAction'), 500)
      } catch (e) {
        this.$notify({ type: 'Error', title: 'Stake', message: e.message })
      }
    },

    async stakeAllFarms() {
      try {
        await this.$store.dispatch('farms/stakeAction', {
          stakes: this.unstakedStakes,
          action: 'stake',
        })
        setTimeout(() => this.$store.dispatch('farms/updateStakesAfterAction'), 500)
      } catch (e) {
        this.$notify({ type: 'Error', title: 'Stake', message: e.message })
      }
    },
  },
}
</script>

<style scoped lang="scss">
.farm-switch::v-deep {
  .el-switch__core {
    height: 22px;
    border-radius: 40px;
    &::after {
      left: 2px;
      height: 16px;
      width: 16px;
      top: 2px;
      border-radius: 50%;
    }
  }
  &.is-checked .el-switch__core::after {
    margin-left: -18px !important;
  }
  /* &.is-checked { */
  /*   .el-switch__core { */
  /*     background-color: var(--main-action-green); */
  /*     border-color: var(--main-action-green); */
  /*   } */
  /* } */
}
.farm-header-container {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.farm-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}
.left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}
.right {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  .gradient-border {
    &:hover {
      --border-width: 4px !important;
    }
    .alcor-button {
      position: relative;
      &:hover {
        background: var(--btn-default);
      }
    }
  }
}
.farms-search-input::v-deep {
  max-width: 200px;
  .el-input__inner {
    background: var(--select-color);
  }
}
.alcor-switch::v-deep {
  font-size: 0.9rem !important;
  background: var(--btn-active) !important;
  .item {
    padding: 4px 10px !important;
  }
  .background {
    background: var(--select-color) !important;
  }
}

.stacked-only {
  white-space: nowrap;
}

.new-farm {
  line-height: 1.2;
}

@media only screen and (max-width: 800px) {
  .farm-header {
    align-items: flex-start;
    flex-direction: column;
  }
  .left {
    flex-direction: column;
    align-items: flex-start;
    width: 100%;
  }
  .right {
    width: 100%;
    justify-content: flex-end;
  }
  .farms-search-input {
    width: 100%;
    max-width: 100%;
  }
}
</style>

<style lang="scss">
// this element is on the body, style is global
.farm-total-rewards {
  display: flex;
  flex-direction: column;
  gap: 8px;
  .reward {
    display: flex;
    align-items: center;
    gap: 4px;
  }
}
// Accessing internal style, better be global
.header-action-badge {
  .el-badge__content {
    z-index: 2;
  }
}
</style>
