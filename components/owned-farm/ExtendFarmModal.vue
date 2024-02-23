<template lang="pug">
div
  //AlcorButton(@click="extend" access) Top up
  AlcorButton(@click="visible = true" access) Top up

  el-dialog(title='zzz' :visible.sync='visible' append-to-body width="400px")
    h1 ololo

</template>

<script>
import AlcorButton from '~/components/AlcorButton'

export default {
  components: {
    AlcorButton
  },

  data() {
    return {
      visible: false
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
}
</script>

<style lang="scss" scoped>
</style>
