<template lang="pug">
#bridge-page
  bridge-form(:formData.sync="formData")
  pre {{ formData }}

</template>

<script>
import BridgeForm from '~/components/bridge/BridgeForm.vue'

export default {
  components: { BridgeForm },
  data: () => ({
    formData: {
      fromNetwork: null,
      toNetwork: null,
      amount: null,
      asset: null,
      sender: null,
      receiver: null
    }
  }),
  watch: {
    '$store.state.selectedAsset'(v) {
      this.formData.asset = v
    },
    '$store.state.ibcClients.sender'(v) {
      this.formData.sender = v
    },
    '$store.state.ibcClients.receiver'(v) {
      this.formData.receiver = v
    }
  },
  mounted() {
    this.formData.asset = this.$store.state.selectedAsset
  }
}
</script>
