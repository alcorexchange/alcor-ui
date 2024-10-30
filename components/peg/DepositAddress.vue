<template lang="pug">
.deposit-address
  .loading.p-4(v-if="loadingAddresses")
    i.el-icon-loading.fs-20
  template(v-else)
    .address.p-3
      .generated
        .muted {{ blockchain.name }} Address
        .address-container
          span {{ this.networkAddress }}
          .pointer.hover-opacity.p-2(@click="copyAddress")
            i.el-icon-copy-document
      .new-address
    .info.p-3
      .info-item.fs-14
        div.muted Required Confirmations
        span {{ blockchain.required_confirmations }}
</template>

<script>
export default {
  name: 'DepositAddress',
  props: ['blockchain'],

  data: () => ({
    addresses: [],
    loadingAddresses: true,
  }),

  computed: {
    networkAddress() {
      if (!this.blockchain) return null
      return this.addresses.find(({ chain }) => chain === this.blockchain.code)?.address
    },
  },

  mounted() {
    this.getAddresses()
  },

  methods: {
    async getAddresses() {
      try {
        const account = 'aw.aq.waa'

        const { data } = await this.$axios.get(
          `https://gate.alcor.exchange/api/dex-accounts/${account}/deposit-addresses/`
        )

        console.log({ addresses: data })
        this.addresses = data
        this.loadingAddresses = false
      } catch (error) {
        console.log('loading addresses error', error)
      }
    },

    generateAddress() {},

    copyAddress() {
      try {
        navigator.clipboard.writeText(this.networkAddress)
        this.$notify({
          title: 'Clipboard',
          message: 'Address copied.',
          type: 'info',
        })
      } catch (error) {}
    },
  },
}
</script>

<style lang="scss" scoped>
.deposit-address {
  border-radius: 8px;
  box-shadow: 0 0 0 1px var(--border-color);
  .loading {
    padding: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .address {
    border-bottom: 1px solid var(--border-color);
  }
  .info {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .info-item {
    display: flex;
    justify-content: space-between;
  }
  .address-container {
    display: flex;
    justify-content: space-between;
    gap: 10px;
    align-items: center;
  }
}
</style>
