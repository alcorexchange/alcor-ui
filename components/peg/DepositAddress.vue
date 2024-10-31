<template lang="pug">
.deposit-address
  .address.p-3
    .loading.p-4(v-if="loadingAddresses")
      i.el-icon-loading.fs-20
    template(v-else)
      .generated(v-if="networkAddress")
        .muted {{ blockchain.name }} Address
        .address-container
          span {{ this.networkAddress }}
          .pointer.hover-opacity(@click="copyAddress")
            i.el-icon-copy-document
      .new-address(v-else)
        AlcorButton(@click="generateAddress") Click to generate the address
  .info.p-3
    .info-item.fs-14
      div.muted Required Confirmations
      span {{ blockchain.required_confirmations }}
</template>

<script>
import AlcorButton from '~/components/AlcorButton.vue'
export default {
  name: 'DepositAddress',

  components: { AlcorButton },

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
        this.loadingAddresses = true
        const account = 'aw.aq.waa'

        const { data } = await this.$axios.get(
          `https://gate.alcor.exchange/api/dex-accounts/${account}/deposit-addresses/`
        )

        this.addresses = data
        this.loadingAddresses = false
      } catch (error) {
        console.log('loading addresses error', error)
      }
    },

    async generateAddress() {
      try {
        this.loadingAddresses = true
        const account = 'aw.aq.waa'
        await this.$axios.post(`https://gate.alcor.exchange/api/dex-accounts/${account}/create-address/`, {
          chain: this.blockchain.code,
        })
        await this.getAddresses()
      } catch (error) {
        console.log('Generating address error', error)
      }
    },

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
    span {
      word-break: break-all;
    }
  }

  .new-address {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 8px 32px;
  }
}
</style>
