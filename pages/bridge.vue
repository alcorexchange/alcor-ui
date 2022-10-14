<template lang="pug">
#bridge-page.d-flex.align-items-center.flex-column.gap-16.mt-5
  circles-bg.bg(stroke="#F89022")
  circles-bg.bg2(stroke="red")
  .fs-48 Alcor IBC Bridge
  .fs-24 Bridge assets from different chains
  bridge-form.mt-4(:formData.sync="formData")

</template>

<script>
import BridgeForm from '~/components/bridge/BridgeForm.vue'
import CirclesBg from '~/components/bridge/CirclesBg.vue'

export default {
  components: { BridgeForm, CirclesBg },
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

<style lang="scss" scoped>
.bg {
  position: absolute;
  top: 50px;
  left: 0px;
}

.bg2 {
  position: absolute;
  top: 50px;
  right: 0px;
}
</style>
