<template lang="pug">
div Deposit Address
</template>

<script>
export default {
  name: 'DepositAddress',
  props: ['blockchain'],

  data: () => ({
    addresses: [],
    loadingAddresses: false,
  }),

  mounted() {
    this.getAddresses()
  },

  methods: {
    getAddresses() {},

    generateAddress() {},
  },
}
</script>

<style lang="scss"></style>
