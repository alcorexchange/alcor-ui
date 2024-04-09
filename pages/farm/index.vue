<template lang="pug">
  .farms-page
    FarmHeader(:search.sync="search" :finished.sync="finished" :hideCreateNew="true" :farmPools="farmPools").mb-2.mt-4
    FarmsTableNew(:farmPools="farmPools" :finished="finished")
</template>

<script>
import FarmHeader from '@/components/farm/FarmHeader'
import FarmsTableNew from '@/components/farm/FarmsTableNew'
export default {
  name: 'FarmsPage',
  components: {
    FarmHeader,
    FarmsTableNew,
  },

  data: () => {
    return {
      search: '',
      finished: false,
    }
  },

  computed: {
    stakedOnly() {
      return this.$store.state.farms.stakedOnly
    },

    pools() {
      return this.$store.getters['farms/farmPools']
        .map((p) => {
          const incentives = p.incentives.filter((i) => {
            if (this.finished) {
              return i.isFinished && i.stakeStatus != 'notStaked'
            } else {
              return i.isFinished == false
            }
          })
          return { ...p, incentives }
        })
        .filter((p) => p.incentives.length > 0)
    },

    farmPools() {
      let pools = this.pools
      const onlyContracts = this.$route.query?.contracts?.split(',') || []

      if (onlyContracts.length > 0) {
        pools = pools.filter((p) => {
          return onlyContracts.includes(p.tokenA.contract) || onlyContracts.includes(p.tokenB.contract)
        })
      }

      if (this.stakedOnly) {
        pools = pools.filter((p) => {
          return p.incentives
            .map((i) => i.incentiveStats)
            .flat(1)
            .map((i) => i.staked)
            .some((s) => s == true)
        })
      }

      pools = pools.filter((p) => {
        const slug =
          p.tokenA.contract + p.tokenA.quantity.split(' ')[1] + p.tokenB.contract + p.tokenB.quantity.split(' ')[1]
        return slug.toLowerCase().includes(this.search.toLowerCase())
      })

      pools.sort((a, b) => {
        return (b?.poolStats?.tvlUSD || 0) - (a?.poolStats?.tvlUSD || 0)
      })

      return pools
    },
  },

  methods: {},

  head() {
    return {
      title: `Alcor Exchange | Earn on providing liquidity | ${this.$store.state.network.name.toUpperCase()}`,
    }
  },
}
</script>

<style scoped lang="scss"></style>
