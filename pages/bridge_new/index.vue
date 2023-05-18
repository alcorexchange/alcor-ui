<template lang="pug">
.bridge-page.pt-5
  AlcorContainer.d-flex.flex-column.gap-8
    .header
      BridgeHeader
    .side.from
      BridgeConnect(label="from").my-1
      BridgeInput(label="from")
    .side.to
      BridgeConnect(label="to").my-1
      BridgeInput(label="to" :locked="true")
    //- .recepient
    .process
      BridgeProcess
    .submit-container
</template>

<script>
import AlcorContainer from '@/components/AlcorContainer'
import BridgeHeader from '@/components/bridge/BridgeHeader'
import BridgeInput from '@/components/bridge/BridgeInput'
import BridgeConnect from '@/components/bridge/BridgeConnect'
import BridgeProcess from '@/components/bridge/BridgeProcess'
export default {
  name: 'Bridge',
  components: {
    AlcorContainer,
    BridgeHeader,
    BridgeInput,
    BridgeConnect,
    BridgeProcess
  }
}
</script>

<style scoped lang="scss">
.bridge-page {
  max-width: 450px;
  margin: auto;
}
</style>
