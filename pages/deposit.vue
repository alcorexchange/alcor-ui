<template lang="pug">
  .deposit-page
    AlcorContainer.p-3
      PageHeader(title="Deposit Crypto")
      .deposit-steps.pt-3
        DepositStep(:active="!!selectedPeg" title="Select Crypto" :showLine="true")
          PegSelect(:pegs="pegs" v-model="selectedPeg" @input="handlePegChange")

        DepositStep(:active="!!selectedNetwork" title="Select Network" :showLine="currentStepIndex >= 2")
          ElSelect(v-model="selectedNetwork" @change="handleNetworkChange").w-100.network-select
            ElOption(v-for="item in networks" :key="item.code" :label="item.name" :value="item.code")

        DepositStep(v-if="currentStepIndex >= 2 && selectedBlockchain" :active="currentStepIndex >= 2" title="Deposit Address")
          DepositAddress(:blockchain="selectedBlockchain")
</template>

<script>
import AlcorContainer from '~/components/AlcorContainer.vue'
import PegSelect from '~/components/peg/PegSelect.vue'
import DepositStep from '~/components/peg/DepositStep.vue'
import DepositAddress from '~/components/peg/DepositAddress.vue'
import PageHeader from '~/components/amm/PageHeader'
export default {
  name: 'Deposit',
  components: {
    AlcorContainer,
    PegSelect,
    DepositStep,
    DepositAddress,
    PageHeader,
  },
  data: () => ({
    pegs: [],
    blockchains: [],
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

    selectedBlockchain() {
      return this.blockchains.find(({ code }) => code === this.selectedNetwork)
    },
  },

  mounted() {
    this.getPegs()
    this.getBlockchains()
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
    async getBlockchains() {
      try {
        const { data } = await this.$axios.get('https://gate.alcor.exchange/api/blockchains/')
        console.log(data)

        this.blockchains = data
      } catch (error) {
        console.log('Getting blockchains error', error)
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
