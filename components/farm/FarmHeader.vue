<template lang="pug">
  .farm-header-container
    .farm-header
      .left
        el-input(v-model="search" class="farms-search-input" placeholder="Search Tokens" clearable)
        .stacked-only(v-if="!hideStakedOnly")
          el-switch.custom-switch(
            active-color="var(--main-action-green)"
            active-text="Staked only"
            :value="$store.state.farms.stakedOnly"
            @change="$store.commit('farms/setStakedOnly', $event)"
          )
        AlcorSwitch.alcor-switch(
          one="Active"
          two="Finished"
          :active="finished ? 'two' : 'one'"
          @toggle="toggle"
        )
        AlcorSwitch.alcor-switch(
          one="Simple"
          two="Advanced"
          :active="$store.state.farms.view === 'SIMPLE' ? 'one' : 'two'"
          @toggle="$store.commit('farms/toggleView')"
        )
      .right
        AlcorLink(class="new-farm" to="/farm/create")
          i.el-icon-circle-plus-outline
          span Open New Farm

        el-badge(v-if="finished && stakedStakes.length != 0" type="success" :value="stakedStakes.length")
          el-tooltip(content="Unstake your finished farms to free account RAM")
            GradientBorder.gradient-border
              AlcorButton(@click="unstakeAll") Claim & Unstake All

        el-badge(v-if="!finished && unstakedStakes.length != 0 && !hideStakeAll" type="warning" :value="unstakedStakes.length")
          GradientBorder.gradient-border
            AlcorButton(@click="stakeAll") Stake All Positions
      //- .right
</template>

<script>
import AlcorSwitch from '@/components/AlcorSwitch'
import AlcorLink from '@/components/AlcorLink'
import AlcorButton from '@/components/AlcorButton'
import GradientBorder from '@/components/alcor-element/GradientBorder'
export default {
  name: 'FarmHeader',

  components: {
    AlcorSwitch,
    AlcorLink,
    AlcorButton,
    GradientBorder,
  },

  props: ['finished', 'stakedOnly', 'hideStakedOnly', 'hideStakeAll'],

  data: () => {
    return {
      search: '',
    }
  },

  computed: {
    // TODO Do we need it ?
    // unstakedFinished() {
    //   let count = 0
    //   this.$store.getters['farms/farmPools']
    //     .forEach(p => p.incentives.filter(i => i.isFinished && i.stakeStatus != 'notStaked' && i.incentiveStats.length > 0)
    //       .forEach(i => {
    //         if (i.stakeStatus != 'notStaked') {
    //           count += 1
    //         }
    //       }))

    //   return count
    // },

    stakedStakes() {
      const stakes = []
      this.$store.getters['farms/farmPools']
        // pools
        .forEach((p) =>
          p.incentives
            .filter(
              (i) =>
                i.isFinished &&
                i.stakeStatus != 'notStaked' &&
                i.incentiveStats.length > 0
            )
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

    unstakedStakes() {
      const stakes = []
      this.$store.getters['farms/farmPools']
        // pools
        .forEach((p) =>
          p.incentives
            .filter(
              (i) =>
                !i.isFinished &&
                i.stakeStatus != 'staked' &&
                i.incentiveStats.length > 0
            )
            //incentives
            .forEach((i) =>
              i.incentiveStats
                .filter((i) => !i.staked)
                // staked stats
                .forEach((s) => stakes.push(s))
            )
        )

      return stakes
    },
  },

  watch: {
    search(val) {
      this.$emit('update:search', val)
    },
  },

  methods: {
    toggle() {
      this.$emit('update:finished', !this.finished)
    },

    async unstakeAll() {
      try {
        await this.$store.dispatch('farms/stakeAction', {
          stakes: this.stakedStakes,
          action: 'unstake',
        })
        setTimeout(
          () => this.$store.dispatch('farms/updateStakesAfterAction'),
          500
        )
      } catch (e) {
        this.$notify({ type: 'Error', title: 'Stake', message: e.message })
      }
    },

    async stakeAll() {
      try {
        await this.$store.dispatch('farms/stakeAction', {
          stakes: this.unstakedStakes,
          action: 'stake',
        })
        setTimeout(
          () => this.$store.dispatch('farms/updateStakesAfterAction'),
          500
        )
      } catch (e) {
        this.$notify({ type: 'Error', title: 'Stake', message: e.message })
      }
    },
  },
}
</script>

<style scoped lang="scss">
.custom-switch::v-deep {
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
  // &.is-checked {
  //   .el-switch__core {
  //     background-color: var(--main-action-green);
  //     border-color: var(--main-action-green);
  //   }
  // }
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
  gap: 8px;
  .gradient-border {
    &:hover {
      --border-width: 4px !important;
    }
  }
  .alcor-button {
    position: relative;
    &:hover {
      background: var(--btn-default);
    }
  }
}
.farms-search-input::v-deep {
  max-width: 240px;
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
