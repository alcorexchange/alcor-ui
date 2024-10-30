<template lang="pug">
  .deposit-page
    h1.fs-24.mb-2 Deposit Crypto
    AlcorContainer.p-4
      .deposit-steps
        DepositStep(:active="true" title="Select Crypto")
          PegSelect(:pegs="pegs" v-model="selectedPeg")
        DepositStep(:active="false" title="Select Network" :isLast="true")
          PegSelect
</template>

<script>
import AlcorContainer from '~/components/AlcorContainer.vue'
import PegSelect from '~/components/peg/PegSelect.vue'
import DepositStep from '~/components/peg/DepositStep.vue'
export default {
  name: 'Deposit',
  components: {
    AlcorContainer,
    PegSelect,
    DepositStep,
  },
  data: () => ({
    pegs: [],
    selectedPeg: null,
  }),

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
}
</style>
