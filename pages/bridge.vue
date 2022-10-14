<template lang="pug">
#bridge-page.d-flex.align-items-center.flex-column.gap-16.mt-5
  .fs-48 Alcor IBC Bridge
  .fs-24 Bridge assets from different chains
  bridge-form.mt-4(:formData.sync="formData")
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
