<template lang="pug">
  .farms-page
    FarmHeader(:search.sync="search" :unstakedFinished="unstakedFinished" :finished.sync="finished" @update:finished="finishedUpdate" :stakedOnly.sync="stakedOnly").mb-2.mt-4
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
      search: '',
      finished: false,
      stakedOnly: false,
    }
  },

  computed: {
    pools() {
      return this.$store.getters['farms/farmPools']
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
    },

    farmPools() {
      let pools = this.pools

      if (this.stakedOnly) {
        pools = pools.filter(p => {
          return p.incentives.map(i => i.incentiveStats).flat(1).map(i => i.staked).some(s => s == true)
        })
      }

      pools = pools.filter(p => {
        const slug = p.tokenA.contract + p.tokenA.quantity.split(' ')[1] + p.tokenB.contract + p.tokenB.quantity.split(' ')[1]
        return slug.toLowerCase().includes(this.search)
      })

      return pools
    },

    unstakedFinished() {
      let count = 0
      this.$store.getters['farms/farmPools']
        .forEach(p => p.incentives.filter(i => i.isFinished && i.stakeStatus != 'notStaked' && i.incentiveStats.length > 0)
          .forEach(i => {
            if (i.stakeStatus != 'notStaked') {
              count += 1
              console.log(i)
            }
          }))

      return count
    },
  },

  methods: {
    finishedUpdate() {
      // value is automatically synced with child.
    },
  },
}
</script>

<style scoped lang="scss"></style>
