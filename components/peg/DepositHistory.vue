<template lang="pug">
  .deposit-history
    h3.fs-16 Deposit History
</template>

<script>
export default {
  name: 'DepositHistory',
  data: () => ({
    history: [],
  }),

  mounted() {
    this.getHistory()
  },

  methods: {
    async getHistory() {
      const user = 'aw.aq.waa'
      const { data } = await this.$axios.get(`https://gate.alcor.exchange/api/dex-accounts/${user}/deposits-history/`)
      console.log(data)
    },
  },
}
</script>

<style lang="scss"></style>
