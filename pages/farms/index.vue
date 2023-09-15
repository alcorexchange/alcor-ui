<template lang="pug">
  .farms-page
    FarmHeader(class="mb-2 mt-4" :finished.sync="finished" @update:finished="finishedUpdate" :stakedOnly.sync="stakedOnly")
    FarmsTable(:farmPools="farmPools" :finished="finished")
</template>

<script>
import FarmHeader from '@/components/farm/FarmHeader'
import FarmsTable from '@/components/farm/FarmsTable'
export default {
  name: 'FarmsPage',
  components: {
    FarmHeader,
    FarmsTable,
  },

  data: () => {
    return {
      finished: false,
      stakedOnly: false,
    }
  },

  computed: {
    farmPools() {
      let pools = this.$store.getters['farms/farmPools']
        .map(p => {
          const incentives = p.incentives.filter(i => {
            if (this.finished) {
              return i.isFinished && i.stakeStatus != 'notStaked'
            } else {
              return i.isFinished == false
            }
          })
          return { ...p, incentives }
        })
        .filter(p => p.incentives.length > 0)

      if (this.stakedOnly) {
        pools = pools.filter(p => {
          return p.incentives.map(i => i.incentiveStats).flat(1).map(i => i.staked).some(s => s == true)
        })
      }

      return pools
    }
  },

  methods: {
    finishedUpdate() {
      // value is automatically synced with child.
    },
  },
}
</script>

<style scoped lang="scss"></style>
