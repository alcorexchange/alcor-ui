<template lang="pug">
  .farm-header-container
    .farm-header
      .left
        el-input(v-model="search" class="farms-search-input" placeholder="Search Tokens" size="medium" prefix-icon='el-icon-search' clearable)
        AlcorSwitch.alcor-switch(
          one="All Farms"
          two="My Farms"
          :active="$store.state.farms.stakedOnly ? 'two' : 'one'"
          @toggle="$store.commit('farms/setStakedOnly', $store.state.farms.stakedOnly ? false : true)"
        )
        el-switch.farm-switch(
          v-if="!hideStakedOnly"
          active-color="var(--main-action-green)"
          active-text="Show Finished"
          :value="finished"
          @change="toggle"
        )
      .right
        el-switch.farm-switch(
          active-color="var(--main-action-green)"
          active-text="Advanced Mode"
          :value="$store.state.farms.view === 'ADVANCED'"
          @change="$store.commit('farms/toggleView')"
        )
        AlcorLink(class="new-farm" to="/farm/create" v-if="!hideCreateNew")
          i.el-icon-circle-plus-outline
          span Open New Farm

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
export default {
  name: 'FarmHeader',

  components: {
    AlcorSwitch,
    AlcorLink,
    AlcorButton,
    GradientBorder,
  },

  props: ['finished', 'stakedOnly', 'hideStakedOnly', 'hideStakeAll', 'hideCreateNew'],

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
