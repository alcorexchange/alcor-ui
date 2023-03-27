<template lang="pug">
  #bridge-form-component.form
    .d-flex.flex-column.flex-md-row.justify-content-center.justify-content-sm-between.flex-wrap.align-items-center.gap-20
      .d-flex.flex-column.gap-20
        span Send from
        alcor-select.network-select(
          :options="fromNetworkOptions"
          :value.sync="sourceName"
          :disabled="inProgress"
          placeholder="Choose Network"
          filterable
        )
          template(#prefix="{ value }")
            img(
              v-if="value"
              :src='require("~/assets/icons/" + value + ".png")',
              height=18
            )
          template(#option="{ option }")
            network-option( :network="option")

        alcor-button.connect-button(
          :disabled="(!sourceName) || (inProgress && this.sourceWallet)"
          @click="connectFromWallet"
        )
          .d-flex.justify-content-between.align-items-center.w-100(v-if="formData.sender")
            .d-flex.align-items-center.gap-8
              img(
                :src='require("~/assets/icons/avatar.png")',
                height=18
              )
              .fs-14 {{ formData.sender }}
            .d-flex.align-items-center.gap-8(@click.stop="logout('sender')")
              .fs-12 Logout
              i.el-icon-right
          .fs-14(v-else) Connect Wallet

      .d-flex.justify-content-center.align-items-center.gap-30
        i.el-icon-right
        span To
        i.el-icon-right

      .d-flex.flex-column.gap-20
        span Receive on
        alcor-select.network-select(
          :options="fromNetworkOptions"
          :value.sync="destinationName"
          :disabled="inProgress"
          placeholder="Choose Network"
          filterable
        )
          template(#prefix="{ value }")
            img(
              v-if="value"
              :src='require("~/assets/icons/" + value + ".png")',
              height=18
            )
          template(#option="{ option }")
            network-option( :network="option")

        alcor-button.connect-button(
          :disabled="(!destinationName) || (inProgress && this.destinationWallet)"
          @click="connectToWallet"
        )
          .d-flex.justify-content-between.align-items-center.w-100(v-if="formData.receiver")
            .d-flex.align-items-center.gap-8
              img(
                :src='require("~/assets/icons/avatar.png")',
                height=18
              )
              .fs-14 {{ formData.receiver }}
            .d-flex.align-items-center.gap-8(@click.stop="logout('receiver')")
              .fs-12 Logout
              i.el-icon-right
          .fs-14(v-else) Connect Wallet



    //.d-flex.justify-content-between


    .d-flex.justify-content-between.gap-16.mt-4.flex-wrap
      .amount-input
        el-input(type="number" placeholder="Amount" v-model="formData.amount" :disabled="inProgress")
        span.max-btn.pointer(@click="setMax") MAX

      alcor-select-two.token-selector(v-model="asset" value-key="symbol" @change="_setAsset" :disabled="inProgress && !!this.asset" placeholder="IBC Token" filterable)
        template(slot="empty")
          .small.muted.text-center Please choose two networks

        template(slot="prefix" v-if="this.asset")
          TokenImage(:src="$tokenLogo(asset.symbol, asset.sourceTokenContract)" height="20")

        alcor-option-two(:value="asset" :label="asset.symbol" v-for="asset in availableAssets")
          .d-flex.align-items-center.w-100
            TokenImage(:src="$tokenLogo(asset.symbol, asset.sourceTokenContract)" height="25")
            .ml-2 {{ asset.symbol}}

    .d-flex.justify-content-center.mt-4
      alcor-button.transfer-btn(v-if="!error" :disabled="!isValid || inProgress" access @click="transfer") Transfer and Prove
      alcor-button.transfer-btn(v-else outline @click="transfer") Complete transfer

      // dev
      //alcor-button.transfer-btn(access @click="help") help
      //alcor-button.transfer-btn(access @click="transfer") Transfer and Prove
      //alcor-button.transfer-btn(outline @click="clear") clear

    BridgeSlider(v-if="inProgress" :steps="steps")

    div(v-if="step === 4")
      .d-flex.justify-content-center.mt-4
        .fs-18 Success! Assets have been bridged!

      .d-flex.justify-content-center.mt-4
        alcor-button(outline v-if="sourceName" @click="openInNewTab(monitorTx(result.source, sourceName))")
          img(:src='require(`~/assets/icons/${sourceName}.png`)' height=20)
          | TX Link

        alcor-button(outline v-if="destinationName" @click="openInNewTab(monitorTx(result.destination, destinationName))").ml-5
          img(:src='require(`~/assets/icons/${destinationName}.png`)' height=20)
          | TX Link
    BridgeHistory
</template>

<script>
// TODO Implement list of wallets
import { mapGetters, mapState, mapMutations } from 'vuex'
import { IBCTransfer } from '~/core/ibc.js'

import AlcorSelectTwo from '~/components/alcor-element/select/select'
import AlcorOptionTwo from '~/components/alcor-element/select/option'

import AlcorSelect from '~/components/AlcorSelect.vue'
import AlcorButton from '~/components/AlcorButton.vue'
import NetworkOption from '~/components/bridge/NetworkOption'
import BridgeSlider from '~/components/bridge/BridgeSlider'
import BridgeHistory from '~/components/bridge/BridgeHistory.vue'
import TokenImage from '~/components/elements/TokenImage'

export default {
  components: {
    AlcorSelect,
    AlcorButton,
    NetworkOption,
    BridgeSlider,
    TokenImage,
    AlcorSelectTwo,
    AlcorOptionTwo,
    BridgeHistory
  },

  data: () => ({
    finished: false,

    assetSelect: null,
    progress: 0,

    formData: {
      amount: null,
      sender: null,
      receiver: null
    },

    sourceWallet: null,
    destinationWallet: null,

    fromNetworkOptions: [{
      value: 'eos',
      label: 'EOS'
    },
    //{
    //  value: 'wax',
    //  label: 'WAX'
    //},
    //{
    //  value: 'proton',
    //  label: 'Proton'
    //},
    {
      value: 'telos',
      label: 'Telos'
    }, {
      value: 'ux',
      label: 'UX Network'
    }]
  }),

  computed: {
    ...mapGetters(['user', 'knownTokens']),

    ...mapGetters({
      source: 'ibcBridge/source',
      destination: 'ibcBridge/destination',
      availableAssets: 'ibcBridge/availableAssets'
    }),

    ...mapState('ibcBridge', [
      'tx',
      'packedTx',
      'emitxferAction',
      'error',
      'result',
      'proofs',
      'step'
    ]),

    inProgress() {
      return [0, 1, 2, 3].includes(this.step)
    },

    isFinished() {
      return this.step === 4
    },

    steps() {
      const { progress } = this

      const status = this.error ? 'error' : 'active'

      if (this.step === 0) {
        return [
          { id: 0, progress, label: 'Submitting source chain transfer', status, message: this.error },
          { id: 1, progress, label: 'Waiting for transaction irreversibility', status: 'waiting' },
          { id: 2, progress, label: 'Fetching proof for interchain transfer', status: 'waiting' },
          { id: 3, progress, label: 'Submitting proof(s)', status: 'waiting' }
        ]
      }

      if (this.step === 1) {
        return [
          { id: 0, progress, label: 'Submitting source chain transfer', status: 'success' },
          { id: 1, progress, label: 'Waiting for transaction irreversibility', status, message: this.error },
          { id: 2, progress, label: 'Fetching proof for interchain transfer', status: 'waiting' },
          { id: 3, progress, label: 'Submitting proof(s)', status: 'waiting' }
        ]
      }

      if (this.step === 2) {
        return [
          { id: 0, progress, label: 'Submitting source chain transfer', status: 'success' },
          { id: 1, progress, label: 'Waiting for transaction irreversibility', status: 'success' },
          { id: 2, progress, label: 'Fetching proof for interchain transfer', status, message: this.error },
          { id: 3, progress, label: 'Submitting proof(s)', status: 'waiting' }
        ]
      }

      if (this.step === 3) {
        return [
          { id: 0, progress, label: 'Submitting source chain transfer', status: 'success' },
          { id: 1, progress, label: 'Waiting for transaction irreversibility', status: 'success' },
          { id: 2, progress, label: 'Fetching proof for interchain transfer', status: 'success' },
          { id: 3, progress, label: 'Submitting proof(s)', status, message: this.error }
        ]
      }

      if (this.step === 4) {
        return [
          { id: 0, progress, label: 'Submitting source chain transfer', status: 'success' },
          { id: 1, progress, label: 'Waiting for transaction irreversibility', status: 'success' },
          { id: 2, progress, label: 'Fetching proof for interchain transfer', status: 'success' },
          { id: 3, progress, label: 'Submitting proof(s)', status: 'success' }
        ]
      }

      return []
    },

    asset: {
      set (asset) {
        return this.setAsset(asset)
      },

      get () {
        return this.$store.state.ibcBridge.asset
      }
    },

    sourceName: {
      set (chain) {
        return this.setSourceName(chain)
      },

      get () {
        return this.$store.state.ibcBridge.sourceName
      }
    },

    destinationName: {
      set (chain) {
        return this.setDestinationName(chain)
      },

      get () {
        return this.$store.state.ibcBridge.destinationName
      }
    },

    isValid() {
      return Object.values(this.formData).every(Boolean) &&
        this.destinationWallet && this.sourceWallet
    }
  },

  watch: {
    availableAssets() {
      if (this.step === 4 || this.step === null) this.asset = null
    },

    sourceName() {
      if (this.sourceName == this.destinationName) {
        this.destinationName = null
        if (this.step === 4 || this.step === null) this.asset = null
      }
    },

    destinationName() {
      if (this.destinationName == this.sourceName) {
        this.sourceName = null
        if (this.step === 4 || this.step === null) this.asset = null
      }
    }
  },

  mounted() {
    // TODO source and destination by query params
    if (this.inProgress && this.asset?.quantity) this.formData.amount = parseFloat(this.asset.quantity)
    if (this.inProgress && !this.error) this.setError('Window was closed')
  },

  methods: {
    ...mapMutations({
      setSourceName: 'ibcBridge/setSourceName',
      setDestinationName: 'ibcBridge/setDestinationName',
      setStep: 'ibcBridge/setStep',
      setTx: 'ibcBridge/setTx',
      setPackedTx: 'ibcBridge/setPackedTx',
      setError: 'ibcBridge/setError',
      setProofs: 'ibcBridge/setProofs',
      setResult: 'ibcBridge/setResult',
      setAsset: 'ibcBridge/setAsset'
    }),

    clear() {
      this.setTx(null)
      this.setStep(null)
      this.setError(null)
      this.setSourceName(null)
      this.setDestinationName(null)
      this.setPackedTx(null)
      this.setProofs(null)
      this.setResult(null)
      this.setAsset(null)
    },

    logout(data) {
      if (this.inProgress) return

      if (data == 'sender') this.sourceWallet.wallet.logout()
      if (data == 'receiver') this.destinationWallet.wallet.logout()

      this.formData[data] = null
    },

    reset() {
      //this.finished = false

      //this.result = {
      //  source: '',
      //  destination: ''
      //}
    },

    updateProgress(value) {
      this.progress = value
    },

    help() {
      this.setStep(2)
    },

    async transfer() {
      if (this.step === 4 || !this.step) {
        if (!this.sourceName || !this.destinationName) return this.$notify({ type: 'info', title: 'IBC', message: 'Select chains' })
        if (!this.sourceWallet || !this.destinationWallet) return this.$notify({ type: 'info', title: 'IBC', message: 'Connect wallets' })
        if ((!this.formData.amount || parseFloat(this.formData.amount) <= 0) && !this.step) return this.$notify({ type: 'info', title: 'IBC', message: 'Select amount' })
        if (!this.asset) return this.$notify({ type: 'info', title: 'IBC', message: 'Select IBC Token' })

        this.setStep(0)
        this.setResult(0)

        try {
          const { precision } = await this.getToken(
            this.source.rpc,
            this.asset.native
              ? this.asset.nativeTokenContract
              : this.asset.sourceTokenContract,
            this.asset.symbol
          )

          this.asset.quantity = parseFloat(this.formData.amount).toFixed(precision) + ' ' + this.asset.symbol
        } catch (e) {
          this.setStep(null)
          return this.$notify({ type: 'error', title: 'Error fetch tokens', message: e })
        }
      } else {
        if ((this.step === 2 || this.step == 3) && !this.destinationWallet) {
          const { status, e } = await this.connectToWallet()

          if (!status) {
            return this.setError(e.message)
          }
        }

        this.setError(null)
      }

      const ibcTransfer = new IBCTransfer(this.source, this.destination, this.sourceWallet, this.destinationWallet, this.asset)

      if (this.step === 0) {
        try {
          const signedTx = await ibcTransfer.signSourceTrx()

          const { tx, packedTx, leap } = await ibcTransfer.sourceTransfer(signedTx) // TODO leap

          // TODO Handle if no
          //const emitxferAction = ibcTransfer.findEmitxferAction(tx)
          //console.log('emitxferAction', emitxferAction)

          this.setStep(1)
          this.setTx(tx)
          this.setPackedTx(packedTx)
          this.setResult({ ...this.result, source: tx.transaction_id })
          return this.transfer()
        } catch (e) {
          this.setStep(null)
          return this.$notify({ type: 'warning', title: 'Sign transaction', message: e })
        }
      }

      if (this.step === 1) {
        let prog = 0
        const progressInterval = setInterval(() => {
          prog = Math.min(prog + 1, 100)
          this.progress = prog
        }, 1700)

        try {
          //throw new Error('test asdfasf 1')
          const tx = await ibcTransfer.waitForLIB(this.source, this.tx, this.packedTx)
          this.setTx(tx)
          this.setStep(2)
          console.log('clean error step 1')
          if (this.error) this.setError(null)
          return this.transfer()
        } catch (e) {
          this.setError(e.message)
          return this.$notify({ type: 'error', title: 'Waiting for LIB', message: e })
        } finally {
          clearInterval(progressInterval)
          this.updateProgress(0)
        }
      }

      if (this.step === 2) {
        try {
          //throw new Error('test asdfasf 2')

          const scheduleProofs = (await ibcTransfer.getScheduleProofs(this.tx)) || []
          //throw new Error('test')
          console.log('scheduleProofs', scheduleProofs)

          const emitxferAction = ibcTransfer.findEmitxferAction(this.tx)
          console.log('emitxferAction', emitxferAction)

          const emitxferProof = await ibcTransfer.getProof({
            type: 'heavyProof',
            action: emitxferAction,
            onProgress: this.updateProgress,
            block_to_prove: this.tx.processed.block_num //block that includes the emitxfer action we want to prove
          })

          console.log('emitxferProof', emitxferProof)

          console.log('setProofs', [...scheduleProofs, emitxferProof])
          this.setProofs([...scheduleProofs, emitxferProof])
          console.log('this.proofs', this.proofs)

          this.setStep(3)
          console.log('clean error step 2')
          if (this.error) this.setError(null)
          return this.transfer()
        } catch (e) {
          this.setError(e.message)
          return this.$notify({ type: 'error', title: 'Fetching Proofs', message: e })
        }
      }

      if (this.step === 3) {
        try {
          //throw new Error('test asdfasf 3')
          console.log('this.proofs', this.proofs)
          const { tx } = await ibcTransfer.submitProofs(this.proofs)
          this.setResult({ ...this.result, destination: tx.transaction_id })
          this.setStep(4)

          console.log('clean error step 3')
          if (this.error) this.setError(null)

          this.asset = null
          this.formData.amount = null
        } catch (e) {
          this.setError(e.message)
          return this.$notify({ type: 'error', title: 'Submitting Destination Proofs ', message: e })
        }
      }
    },

    _setAsset(asset) {
      this.asset = asset
    },

    async setMax() {
      if (!this.sourceWallet) {
        return this.$notify({ type: 'info', title: 'Connect wallet', message: 'Connect source wallet to set max amount' })
      }

      if (!this.asset) return this.$notify({ type: 'info', title: 'Select IBC Token', message: 'Select IBC token to set MAX amount' })

      const contract = this.asset.native
        ? this.asset.nativeTokenContract
        : this.asset.sourceTokenContract

      let balances
      try {
        const { data } = await this.$axios.get(`${this.source.lightapi}/api/balances/${this.source.name}/${this.sourceWallet.name}`)
        balances = data.balances
      } catch (e) {
        return this.$notify({ type: 'warning', title: 'Fail Balance fetch', message: e.message })
      }

      const balance = balances.find(b => {
        return b.currency === this.asset.symbol && b.contract === contract
      })

      if (!balance) return this.$notify({ type: 'warning', title: 'Set MAX', message: 'No balance found' })

      this.formData.amount = balance.amount
    },

    makeError() {
      this.steps[1].status = 'error'
      this.steps[1].message = 'TX not approved'
    },

    async connectFromWallet() {
      try {
        const { wallet, name, authorization } = await this.$store.dispatch('chain/asyncLogin', {
          chain: this.sourceName,
          message: 'Connect Source Wallet'
        })

        this.formData.sender = name
        this.sourceWallet = { wallet, name, authorization }
      } catch (e) {
        this.$notify({ type: 'warning', title: 'Wallet not connected', message: e })
      }
    },

    async connectToWallet() {
      // TODO Анкер не подрубается со второго раза
      try {
        const { wallet, name, authorization } = await this.$store.dispatch('chain/asyncLogin', {
          chain: this.destinationName,
          message: 'Connect Destination Wallet'
        })

        this.formData.receiver = name
        this.destinationWallet = { wallet, name, authorization }
        return { status: true }
      } catch (e) {
        this.$notify({ type: 'warning', title: 'Wallet not connected', message: e })
        return { status: false, e }
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.form {
  background: var(--background-color-base);
  border: var(--border-1);
  border-radius: 12px;
  width: 100%;
  max-width: 720px;
  margin: 0 auto;
  padding: 32px;
  z-index: 100;

  .transfer-btn {
    width: 312px;
  }

  .token-selector {
    width: 100%;
    max-width: 150px;
  }
  .network-select,
  .connect-button {
    width: 226px;
    height: 40px;
  }

  .choise-asset-btn {
    width: 140px;

    border: 1px solid var(--btn-default);

    &:hover {
      border-color: var(--main-green) !important;
      background-color: var(--btn-default);
    }

  }
}
</style>

<style lang="scss">
.amount-input {
  position: relative;
  width: 100%;
  max-width: 470px;

  &:hover .el-input__inner,
  & .el-input__inner:active,
  & .el-input__inner:focus {
    border-color: var(--main-green) !important;
  }

  & .el-input__inner,
  & .el-input-group__prepend {
    border: 1px solid var(--select-color);
    background: var(--select-color);
  }

  .max-btn {
    position: absolute;
    top: 6px;
    left: 12px;
    font-size: 14px;
    background: var(--bg-alter-1);
    border: var(--border-1);
    border-radius: 2px;
    color: var(--text-default);
    padding: 2px 4px;
  }

  & .el-input__inner {
    padding: 0 60px !important;
  }
}
</style>
