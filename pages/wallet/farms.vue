<template lang="pug">
.farms-page
  FarmHeader(:search.sync="search" :finished.sync="finished" :hideStakedOnly="true" :hideStakeAll="true").mb-2.mt-4
  FarmsTableNew(:farmPools="farmPools" :finished="finished")
</template>

<script>
import FarmHeader from '@/components/farm/FarmHeader'
import FarmsTableNew from '@/components/farm/FarmsTableNew'
export default {
  name: 'WalletFarms',
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

      pools = pools.filter((p) => {
        return p.incentives
          .map((i) => i.incentiveStats)
          .flat(1)
          .map((i) => i.staked)
          .some((s) => s == true)
      })

      pools = pools.filter((p) => {
        const slug =
          p.tokenA.contract +
          p.tokenA.quantity.split(' ')[1] +
          p.tokenB.contract +
          p.tokenB.quantity.split(' ')[1]
        return slug.toLowerCase().includes(this.search.toLowerCase())
      })

      return pools
    },
  },
}
</script>

<style scoped lang="scss"></style>
