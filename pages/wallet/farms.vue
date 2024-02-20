<template lang="pug">
.farms-page
  .header.mb-3
    .fs-20.fw-medium Owned Farms
    AlcorLink(class="new-farm" to="/farm/create" )
      i.el-icon-circle-plus-outline
      span Open New Farm

  .items
    OwnedFarmItem(
      v-for="farm in myOwnedFarms"
      :farm="farm"
      @extend="extend($event)"
    )
    .muted(v-if="!myOwnedFarms.length") You don't own any farms.

  .fs-20.mb-3.mt-5.fw-medium Staked Farms

  FarmHeader(:search.sync="search" :finished.sync="finished" :hideStakedOnly="true" :hideStakeAll="true").mb-2.mt-4
  FarmsTableNew(:farmPools="farmPools" :finished="finished")

</template>

<script>
import { mapState } from 'vuex'
import FarmHeader from '@/components/farm/FarmHeader'
import AlcorLink from '@/components/AlcorLink'
import FarmsTableNew from '@/components/farm/FarmsTableNew'
import OwnedFarmItem from '~/components/owned-farm/OwnedFarmItem'

export default {
  name: 'WalletFarms',
  components: {
    OwnedFarmItem,
    FarmHeader,
    FarmsTableNew,
    AlcorLink,
  },

  data: () => {
    return {
      search: '',
      finished: false,
    }
  },

  methods: {
    extend(incentive) {
      this.$prompt(`The farm duration will be reset to the one originally assigned upon creation.
        (${incentive.durationInDays} Days)`, `Amount of
        ${incentive.reward.quantity.split(' ')[1]} for reward.`, 'Extend Farm', {
        confirmButtonText: 'OK',
        cancelButtonText: 'Cancel',
        inputPattern: /^\d*\.?\d*$/,
        inputErrorMessage: 'Invalid reward amount',
      }).then(async ({ value }) => {
        const actions = [
          {
            account: incentive.reward.contract,
            name: 'transfer',
            authorization: [this.user.authorization],

            data: {
              from: this.user.name,
              to: this.network.amm.contract,
              quantity:
                parseFloat(value).toFixed(incentive.reward.symbol.precision) + ' ' + incentive.reward.symbol.symbol,
              memo: 'incentreward#' + incentive.id,
            },
          },
        ]

        await this.$store.dispatch('chain/sendTransaction', actions)
        await this.$store.dispatch('farms/loadIncentives')
      })
    },
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
          p.tokenA.contract + p.tokenA.quantity.split(' ')[1] + p.tokenB.contract + p.tokenB.quantity.split(' ')[1]
        return slug.toLowerCase().includes(this.search.toLowerCase())
      })

      return pools
    },

    myOwnedFarms() {
      return this.$store.getters['farms/farmPools'].filter((f) => {
        if (f.incentives.length == 0) return false

        return f.incentives.some((i) => {
          return i.creator == this.$store.state.user?.name
        })
      })
    },
  },
}
</script>

<style lang="scss">
.owned-farm-item {
  display: grid;
  grid-template-columns: 21% 1fr auto;
  & > * {
    padding: 14px 10px;
  }
}
.icon-and-value {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
}
</style>

<style lang="scss" scoped>
.items {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
</style>
