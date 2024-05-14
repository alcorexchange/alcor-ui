<template lang="pug">
.farms-page
  FarmHeader(:search.sync="search" :finished.sync="finished" :hideCreateNew="true").mb-2.mt-4
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

    farmPools() {
      const { hideZeroAPR } = this.$store.state.farms
      const onlyContracts = this.$route.query?.contracts?.split(',') || []
      const search = this.search.toLowerCase()

      let pools = this.$store.getters['farms/farmPools']
        .map((p) => {
          const incentives = p.incentives.filter((i) => {
            if (hideZeroAPR && i.apr == 0) return false

            if (this.finished) {
              return i.isFinished && i.stakeStatus != 'notStaked'
            } else {
              return !i.isFinished
            }
          })
          return { ...p, incentives }
        })
        .filter((p) => p.incentives.length > 0)

      if (onlyContracts.length > 0) {
        pools = pools.filter((p) =>
          onlyContracts.includes(p.tokenA.contract) ||
          onlyContracts.includes(p.tokenB.contract)
        )
      }

      if (this.stakedOnly) {
        pools = pools.filter((p) =>
          p.incentives
            .flatMap((i) => i.incentiveStats)
            .some((i) => i.staked)
        )
      }

      pools = pools.filter((p) => {
        const slug = (
          p.tokenA.contract +
          p.tokenA.quantity.split(' ')[1] +
          p.tokenB.contract +
          p.tokenB.quantity.split(' ')[1]
        ).toLowerCase()
        return slug.includes(search)
      })

      pools.sort((a, b) => (b?.poolStats?.tvlUSD || 0) - (a?.poolStats?.tvlUSD || 0))

      return pools
    }
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
