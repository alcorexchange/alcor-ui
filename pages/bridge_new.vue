<template lang="pug">
.bridge-page-wrapper.pt-5
  AlcorContainer
    .header.mb-2
      BridgeHeader
    NuxtChild
</template>

<script>
import AlcorContainer from '@/components/AlcorContainer'
import BridgeHeader from '@/components/bridge/BridgeHeader'
export default {
  components: {
    AlcorContainer,
    BridgeHeader
  }
}
</script>

<style scoped lang="scss">
.bridge-page-wrapper {
  max-width: 450px;
  margin: auto;
}
</style>
