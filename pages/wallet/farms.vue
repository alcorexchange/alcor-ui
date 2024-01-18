<template lang="pug">
.farms-page
  //- FarmHeader(:search.sync="search" :finished.sync="finished" :hideStakedOnly="true" :hideStakeAll="true").mb-2.mt-4
  //- FarmsTableNew(:farmPools="farmPools" :finished="finished")

  .fs-20 My Owned Farms
  | {{ myOwnedFarms.length }}
  div(v-for="pool of myOwnedFarms").mt-4
    span {{ pool.tokenA.quantity.split(' ')[1] }}/{{ pool.tokenB.quantity.split(' ')[1] }}
    span.ml-2 {{ pool.fee / 10000 }} %

    .bordered
      table
        tbody
          tr
            th id
            th reward
            th finished
            th lastUpdateTime
            th numberOfStakes
            th durationInDays
            th daysRemain
            th rewardPerDay
            th Action

          tr(v-for="incentive of pool.incentives")
            td {{ incentive.id }}
            td {{ incentive.reward.quantity }}
            td {{ incentive.isFinished }}
            td {{ incentive.lastUpdateTime | moment('YYYY-MM-DD HH:mm') }}
            td {{ incentive.numberOfStakes }}
            td {{ incentive.durationInDays }}
            td {{ incentive.daysRemain }}
            td {{ incentive.rewardPerDay }}
            td
              el-button(@click="extend(incentive)" size="small") Extend

    //div(v-for)

    //FarmsTableNew(:farmPools="myOwnedFarms" :finished="finished")

</template>

<script>
import { mapState } from 'vuex'
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

  methods: {
    extend(incentive) {
      this.$prompt(`Amount of ${incentive.reward.quantity.split(' ')[1]} for reward`, 'Extend Farm', {
        confirmButtonText: 'OK',
        cancelButtonText: 'Cancel',
        inputPattern: /^[0-9]*$/,
        inputErrorMessage: 'Invalid reward amount'
      }).then(async ({ value }) => {
        console.log('zzz', this.network)
        const actions = [{
          account: incentive.reward.contract,
          name: 'transfer',
          authorization: [this.user.authorization],

          data: {
            from: this.user.name,
            to: this.network.amm.contract,
            quantity: parseFloat(value).toFixed(incentive.reward.symbol.precision) + ' ' + incentive.reward.symbol.symbol,
            memo: 'incentreward#' + incentive.id,
          },
        }]

        const r = await this.$store.dispatch('chain/sendTransaction', actions)
        console.log({ r })
      })
    }
  },

  computed: {
    ...mapState(['user', 'network']),

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

    myOwnedFarms() {
      return this.$store.getters['farms/farmPools'].filter(f => {
        if (f.incentives.length == 0) return false

        return f.incentives.some(i => {
          return i.creator == this.$store.state.user?.name
        })
      })
    }
  },
}
</script>

<style scoped lang="scss"></style>
