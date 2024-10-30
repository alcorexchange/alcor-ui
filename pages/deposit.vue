<template lang="pug">
  .deposit-page
    h1.fs-24.mb-2 Deposit Crypto
    AlcorContainer.p-4
      .deposit-steps
        DepositStep(:active="currentStepIndex >= 0" title="Select Crypto" :showLine="true")
          PegSelect(:pegs="pegs" v-model="selectedPeg" @input="handlePegChange")
        DepositStep(:active="currentStepIndex >= 1" title="Select Network" :showLine="currentStepIndex >= 2")
          ElSelect(v-model="selectedNetwork" @change="handleNetworkChange").w-100.network-select
            ElOption(v-for="item in networks" :key="item.code" :label="item.name" :value="item.code")
        DepositStep(v-if="currentStepIndex >= 2" :active="currentStepIndex >= 2" title="Deposit Address")
          DepositAddress
</template>

<script>
import AlcorContainer from '~/components/AlcorContainer.vue'
import PegSelect from '~/components/peg/PegSelect.vue'
import DepositStep from '~/components/peg/DepositStep.vue'
import DepositAddress from '~/components/peg/DepositAddress.vue'
export default {
  name: 'Deposit',
  components: {
    AlcorContainer,
    PegSelect,
    DepositStep,
    DepositAddress,
  },
  data: () => ({
    pegs: [],
    selectedPeg: null,
    selectedNetwork: null,
    steps: ['PEG', 'NETWORK', 'ADDRESS'],
    currentStep: 'PEG',
  }),

  computed: {
    networks() {
      if (!this.selectedPeg) return []
      return this.pegs.find(({ symbol }) => this.selectedPeg === symbol).currencies.map((c) => c.chain)
    },
    currentStepIndex() {
      return this.steps.findIndex((s) => s === this.currentStep)
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
        console.log('Getting tokens error', error)
      }
    },
    handlePegChange() {
      this.currentStep = 'NETWORK'
      this.selectedNetwork = null
    },
    handleNetworkChange() {
      this.currentStep = 'ADDRESS'
    },
  },
}
</script>

<style lang="scss">
.deposit-page {
  max-width: 640px;
  margin: auto;
  margin-top: 40px;
  .deposit-steps {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .network-select {
    .el-input__inner {
      padding-left: 20px;
    }
  }
}
</style>
