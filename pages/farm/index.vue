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
      const searchContracts = new Set(onlyContracts)

      return this.$store.getters['farms/farmPools']
        .reduce((filteredPools, pool) => {
          // Фильтруем стимулы
          const incentives = pool.incentives.filter(i => {
            if (hideZeroAPR && i.apr === 0) return false
            if (this.finished) {
              return i.isFinished && i.stakeStatus !== 'notStaked'
            }
            return !i.isFinished
          })

          // Если нет подходящих стимулов, пропускаем этот пул
          if (incentives.length === 0) return filteredPools

          // Фильтрация по контрактам
          if (searchContracts.size > 0 &&
            !searchContracts.has(pool.tokenA.contract) &&
            !searchContracts.has(pool.tokenB.contract)) {
            return filteredPools
          }

          // Фильтрация только по застейканным
          if (this.stakedOnly && !incentives.some(i => i.incentiveStats.some(stat => stat.staked))) {
            return filteredPools
          }

          // Фильтрация по поисковому запросу
          const slug = (pool.tokenA.contract + pool.tokenA.quantity.split(' ')[1] + pool.tokenB.contract + pool.tokenB.quantity.split(' ')[1]).toLowerCase()
          if (!slug.includes(search)) {
            return filteredPools
          }

          // Добавляем пул к результирующему массиву, если он прошёл все фильтры
          filteredPools.push({ ...pool, incentives })
          return filteredPools
        }, [])
        .sort((a, b) => (b?.poolStats?.tvlUSD || 0) - (a?.poolStats?.tvlUSD || 0))
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
