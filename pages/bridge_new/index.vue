<template lang="pug">
.bridge-page.pt-5
  AlcorContainer
    .header
      BridgeHeader
    .side.from
      BridgeInput(label="from")
    .side.to
    .recepient
    .process
    .submit-container
</template>

<script>
import AlcorContainer from '@/components/AlcorContainer'
import BridgeHeader from '@/components/bridge/BridgeHeader'
import BridgeInput from '@/components/bridge/BridgeInput'
export default {
  name: 'Bridge',
  components: {
    AlcorContainer,
    BridgeHeader,
    BridgeInput
  }
}
</script>

<style scoped lang="scss">
.bridge-page {
  max-width: 450px;
  margin: auto;
}
</style>
