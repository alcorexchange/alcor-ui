<template lang="pug">
div
  AlcorButton(@click="visible = true" access) Top up

  el-dialog(title='Extend Farm' :visible.sync='visible' append-to-body width="450px")
    Note(class="fs-14") The farm duration will be reset to the one originally assigned upon creation. ({{incentive.durationInDays}} Days)

    //.mt-3.mb-2.w-100
      .fs-14 Select {{ incentive.reward.symbol.symbol }} amount

    FarmTokenInput(
      label="New Reward Amount"
      :canRemove="false"
      :locked="true"
      :token="token"
      v-model="amount"
    ).mt-3

    AlcorButton.mt-3.w-100(class="submit" access @click="submit") Extend Farm
</template>

<script>
import { mapState, mapGetters } from 'vuex'
import FarmTokenInput from '@/components/farm/FarmTokenInput'
import AlcorButton from '~/components/AlcorButton'
import Note from '~/components/farm/Note'
import SelectToken from '~/components/modals/amm/SelectToken2'

export default {
  components: {
    AlcorButton,
    SelectToken,
    Note,
    FarmTokenInput
  },

  props: ['incentive'],

  data() {
    return {
      visible: false,
      amount: 0
    }
  },

  computed: {
    ...mapState(['network']),
    ...mapGetters(['user']),

    token() {
      const reward = this.incentive.reward

      return {
        contract: reward.contract,
        symbol: reward.symbol.symbol,
        currency: reward.symbol.symbol,
        decimals: reward.symbol.precision
      }
    }
  },

  methods: {
    async submit() {
      try {
        await this.extend()
        this.visible = false
        console.log('visible', this.visible)
      } catch (e) {
        this.$notify({
          type: 'error',
          title: 'Extend Farm',
          message: e.message,
        })
      }
    },

    async extend() {
      const { incentive } = this

      const actions = [
        {
          account: incentive.reward.contract,
          name: 'transfer',
          authorization: [this.user.authorization],

          data: {
            from: this.user.name,
            to: this.network.amm.contract,
            quantity: parseFloat(this.amount).toFixed(incentive.reward.symbol.precision) + ' ' + incentive.reward.symbol.symbol,
            memo: 'incentreward#' + incentive.id,
          },
        },
      ]

      await this.$store.dispatch('chain/sendTransaction', actions)

      setTimeout(() => {
        this.$store.dispatch('farms/loadIncentives').then(() => {
          this.$store.dispatch('farms/setFarmPoolsWithAPR')
        })
      }, 1000)
    },
  },
}
</script>

<style lang="scss" scoped>
</style>
