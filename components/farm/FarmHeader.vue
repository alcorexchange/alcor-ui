<template lang="pug">
  .farm-header
    .left
      el-input(v-model="search" class="farms-search-input" placeholder="Search Tokens" clearable)
      AlcorSwitch(
        class="alcor-switch"
        one="Active"
        two="Finished"
        :active="finished ? 'two' : 'one'"
        @toggle="toggle"
      )
      .stacked-only
        el-switch(
          active-text="Stacked only"
          :value="$store.state.farms.stakedOnly"
          @change="$store.commit('farms/setStakedOnly', $event)"
        )
    .right
      AlcorSwitch(
      one="Simple"
        two="Advanced"
        :active="$store.state.farms.view === 'SIMPLE' ? 'one' : 'two'"
        @toggle="$store.commit('farms/toggleView')"
      )
      el-badge(v-if="finished" type="success" :value="stakedStakes.length")
        el-button(@click="unstakeAll") Unstake All Positions

      el-badge(v-else type="warning" :value="unstakedStakes.length")
        el-button(@click="stakeAll") Stake All Positions
    //.right
      AlcorLink(class="new-farm" to="/farms/create")
        i.el-icon-circle-plus-outline
        span Open New Farm
</template>

<script>
import AlcorSwitch from '@/components/AlcorSwitch'
import AlcorLink from '@/components/AlcorLink'
export default {
  name: 'FarmHeader',

  components: {
    AlcorSwitch,
    AlcorLink,
  },

  props: ['finished', 'stakedOnly'],

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
      await this.$store.dispatch('farms/stakeAction', {
        stakes: this.unstakedStakes,
        action: 'unstake',
      })
      setTimeout(
        () => this.$store.dispatch('farms/updateStakesAfterAction'),
        500
      )
    },

    async stakeAll() {
      await this.$store.dispatch('farms/stakeAction', {
        stakes: this.unstakedStakes,
        action: 'stake',
      })
      setTimeout(
        () => this.$store.dispatch('farms/updateStakesAfterAction'),
        500
      )
    },
  },
}
</script>

<style scoped lang="scss">
.farm-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
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
}
.farms-search-input::v-deep {
  max-width: 240px;
  .el-input__inner {
    background: var(--select-color);
  }
}
.alcor-switch {
  font-size: 0.9rem;
  background: var(--btn-active);
  &::v-deep {
    .item {
      padding: 4px 10px;
    }
    .background {
      background: var(--select-color);
    }
  }
}

.new-farm {
  padding: 8px 16px !important;
}
</style>
