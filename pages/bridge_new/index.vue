<template lang="pug">
.bridge-page.d-flex.flex-column.gap-8
  .side.from
    BridgeConnect(label="From" :connection.sync="sourceWallet").my-1
    BridgeInput(label="from" :tokens="availableAssets")
  .side.to
    // hide label when connected.
    BridgeConnect(label="To custom recipient" beforeConnect="or" :connection.sync="destinationWallet").my-1
    BridgeToInput(placeholder="Enter Address")
  //- .recepient
  .process
    BridgeProcess
  .submit-container
    AlcorButton.w-100.submit(big access :disabled="false") {{ renderSubmitText }}
</template>

<script>
import { mapGetters } from 'vuex'
import AlcorContainer from '@/components/AlcorContainer'
import BridgeHeader from '@/components/bridge/BridgeHeader'
import BridgeInput from '@/components/bridge/BridgeInput'
import BridgeToInput from '@/components/bridge/BridgeToInput'
import BridgeConnect from '@/components/bridge/BridgeConnect'
import BridgeProcess from '@/components/bridge/BridgeProcess'
import AlcorButton from '@/components/AlcorButton'
export default {
  name: 'Bridge',
  components: {
    AlcorButton,
    AlcorContainer,
    BridgeHeader,
    BridgeInput,
    BridgeToInput,
    BridgeConnect,
    BridgeProcess,
  },

  data: () => ({
    formData: {
      amount: null,
      sender: null,
      receiver: null,
    },
    sourceWallet: null,
    destinationWallet: null,
  }),

  computed: {
    ...mapGetters({
      availableAssets: 'ibcBridge/availableAssets',
    }),
    renderSubmitText() {
      return 'Bridge X TO C'
    },
  },
  methods: {},
}
</script>

<style scoped lang="scss">
.bridge-page {
  max-width: 450px;
  margin: auto;
}
.submit {
  font-weight: 500;
  &.disabled {
    background: var(--btn-default) !important;
    color: #636366 !important;
    border-color: var(--btn-default) !important;
    opacity: 0.8;
    filter: none !important;
  }
}
.submit:hover {
  background: var(--main-green) !important;
  color: var(--text-theme) !important;
}
</style>
