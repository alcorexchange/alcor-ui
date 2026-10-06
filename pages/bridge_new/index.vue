<template lang="pug">
.bridge-page.d-flex.flex-column.gap-8
  .side.from
    BridgeConnect(label="From" :connection.sync="sourceWallet" :network="$store.state.ibcBridge.sourceName" @logout="tryLogout('sender')").mt-2.mb-2
    BridgeInput(label="from" :tokens="availableAssets" @networkChange="handleSourceChange")
  .side.to
    // hide label when connected.
    BridgeConnect(label="To custom recipient" connectLabel="or" :connection.sync="destinationWallet" :network="$store.state.ibcBridge.destinationName" @logout="tryLogout('receiver')").mt-2.mb-2
    BridgeToInput(placeholder="Enter Address" @networkChange="handleDestinationChange" v-model="customAddress")
  //- .recepient
  .process
    BridgeProcess
  .submit-container
    AlcorButton.w-100.submit(big access :disabled="false") {{ renderSubmitText }}
</template>

<script>
import { mapGetters, mapMutations } from 'vuex'
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
    sourceWallet: null,
    destinationWallet: null,
    customAddress: null,
  }),

  computed: {
    ...mapGetters({
      availableAssets: 'ibcBridge/availableAssets',
    }),

    sourceName: {
      set(chain) {
        return this.setSourceName(chain)
      },
      get() {
        return this.$store.state.ibcBridge.sourceName
      },
    },

    destinationName: {
      set(chain) {
        this.setDestinationName(chain)
      },

      get() {
        return this.$store.state.ibcBridge.destinationName
      },
    },

    renderSubmitText() {
      return 'Bridge X TO C'
    },
  },

  methods: {
    ...mapMutations({
      setSourceName: 'ibcBridge/setSourceName',
      setDestinationName: 'ibcBridge/setDestinationName',
    }),

    handleSourceChange() {
      if (this.sourceName == this.destinationName) {
        this.destinationName = null
        this.tryLogout('receiver')
      }

      if (this.sourceWallet) {
        this.tryLogout('sender')
      }
    },

    handleDestinationChange() {
      if (this.destinationName == this.sourceName) {
        this.sourceName = null
        this.tryLogout('sender')
      }

      if (this.destinationWallet) {
        this.tryLogout('receiver')
      }
    },

    tryLogout(side) {
      if (side === 'sender') {
        // FIXME: Is this async function?
        this.sourceWallet?.wallet?.logout()
        this.sourceWallet = null
      }
      if (side === 'receiver') {
        this.destinationWallet?.wallet?.logout()
        this.destinationWallet = null
      }
    },
  },
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
