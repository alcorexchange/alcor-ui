<template lang="pug">
  .withdraw-page
    .d-flex.align-items-center.pb-3
      ReturnLink.start.fs-20
        span.title Withdraw
    AlcorContainer.p-3
      .steps
        DepositStep(title="Select Crypto" :showLine="true" :active="!!selectedPeg")
          PegSelect(:pegs="pegs" v-model="selectedPeg" @input="handlePegChange")

        DepositStep(title="Withdraw To" :showLine="true" :active="addressStepActive")
          WithdrawAddress(:networks="networks" :selectedNetwork.sync="selectedNetwork" :address.sync="address")

        DepositStep(title="Amount")
          div
            span.fs-14.muted Amount
            ElInput(v-model="amount")
    AlcorContainer.mt-3.p-3
      WithdrawHistory
</template>

<script>
import ReturnLink from '@/components/ReturnLink'
import AlcorContainer from '~/components/AlcorContainer.vue'
import PegSelect from '~/components/peg/PegSelect.vue'
import DepositStep from '~/components/peg/DepositStep.vue'
import WithdrawAddress from '~/components/peg/WithdrawAddress.vue'
import WithdrawHistory from '~/components/peg/WithdrawHistory.vue'
export default {
  name: 'Deposit',
  components: {
    AlcorContainer,
    PegSelect,
    DepositStep,
    ReturnLink,
    WithdrawAddress,
    WithdrawHistory,
  },
  data: () => ({
    pegs: [],
    selectedPeg: null,
    selectedNetwork: null,
    address: null,
    alcorUesr: null,
    amount: null,
    steps: ['PEG', 'ADDRESS', 'AMOUNT'],
    currentStep: 'PEG',
  }),

  computed: {
    currentStepIndex() {
      return this.steps.findIndex((s) => s === this.currentStep)
    },

    networks() {
      if (!this.selectedPeg) return []
      return this.pegs.find(({ symbol }) => this.selectedPeg === symbol).currencies.map((c) => c.chain)
    },

    addressStepActive() {
      const v = true
      return v ? !!this.selectedNetwork && !!this.address : this.alcorUesr
    },
  },

  mounted() {
    this.getPegs()
  },
  methods: {
    async getPegs() {
      try {
        const { data } = await this.$axios.get('https://gate.alcor.exchange/api/pegs/')
        this.pegs = data
      } catch (error) {
        console.log('Getting pegs error', error)
      }
    },

    handlePegChange() {
      this.currentStep = 'PEG'
      this.selectedNetwork = null
    },

    handleNetworkChange() {
      this.currentStep = 'ADDRESS'
    },
  },
}
</script>

<style lang="scss">
.withdraw-page {
  max-width: 800px;
  margin: auto;
  margin-top: 40px;

  .steps {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
}
</style>
