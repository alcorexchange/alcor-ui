<template lang="pug">
#bridge-form-component.form
  .p-3
    el-alert(
      title="Bridge UI BETA Version"
      type="warning"
      show-icon)

      div You can always use an alternative UI to continue the transaction:
        a(href="https://ibc-retry.alcor.exchange/" target="_blank")  USDT (Alcor)
        |  |
        a(href="https://ibc-retry.uxnetwork.io/" target="_blank")  Other Tokens
        //div.d-flex.flex-column
  .send-and-receive
    .send-from.d-flex.flex-column
      .mb-3 Send from
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

    .receive-on.d-flex.flex-column
      .mb-3 Receive on
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

    .to
      .to-desktop.d-flex.justify-content-center.align-items-center.gap-30
        i.el-icon-right
        span To
        i.el-icon-right
      i.to-mobile.el-icon-bottom

    AlcorButton.connect-button.connect-button-left(
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

    AlcorButton.connect-button.connect-button-right(
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

  .amount-container.d-flex.justify-content-between.gap-32.mt-4
    .amount-input
      el-input(type="number" placeholder="Amount" v-model="formData.amount" :disabled="inProgress")
      span.max-btn.pointer(@click="setMax") MAX

    AlcorSelectTwo.network-select(v-model="asset" value-key="symbol" @change="_setAsset" :disabled="inProgress && !!this.asset" placeholder="IBC Token" filterable)
      template(slot="empty")
        .small.muted.text-center Chose Send & Receive

      template(slot="prefix" v-if="this.asset")
        TokenImage(:src="$tokenLogo(asset.symbol, asset.sourceTokenContract)" height="20")

      AlcorOptionTwo(:value="asset" :label="asset.symbol" v-for="asset in availableAssets")
        .d-flex.align-items-center.w-100
          TokenImage(:src="$tokenLogo(asset.symbol, asset.sourceTokenContract)" height="25")
          .ml-2 {{ asset.symbol}}

  .d-flex.justify-content-center.mt-4
    AlcorButton.transfer-btn(v-if="!error" :disabled="!isValid || inProgress" access @click="transfer") Transfer and Prove
    AlcorButton.transfer-btn(v-else outline @click="transfer") Complete transfer

    // dev
    //alcor-button.transfer-btn(access @click="help") help
    //alcor-button.transfer-btn(access @click="transfer") Transfer and Prove
    //alcor-button.transfer-btn(outline @click="clear") clear

  BridgeSlider(v-if="inProgress" :steps="steps")

  div(v-if="step === 4")
    .d-flex.justify-content-center.text-center.mt-4
      .fs-18 Success! Assets have been bridged!

    .d-flex.justify-content-center.mt-4.gap-10
      AlcorButton(outline v-if="sourceName" @click="openInNewTab(monitorTx(result.source, sourceName))")
        img(:src='require(`~/assets/icons/${sourceName}.png`)' height=20)
        | TX Link
      AlcorButton(outline v-if="destinationName" @click="openInNewTab(monitorTx(result.destination, destinationName))")
        img(:src='require(`~/assets/icons/${destinationName}.png`)' height=20)
        | TX Link

  .settings
    el-dropdown(trigger="click")
      AlcorButton.action.p-0(iconOnly flat)
        i.el-icon-s-tools
      el-dropdown-menu.bridge-setting-dropdown.p-2
        AlcorButton(@click="resetState") ⚠️ {{ $t('Reset State') }}

  //BridgeHistory
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
import BridgeHistory from '~/components/bridge/BridgeHistory'

import TokenImage from '~/components/elements/TokenImage'

import { getMultyEndRpc } from '~/utils/eosjs'

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
    {
      value: 'wax',
      label: 'WAX'
    },
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
      //this.loadUncompletedTransfers()

      if (this.sourceName == this.destinationName) {
        this.destinationName = null
        if (this.step === 4 || this.step === null) this.asset = null
      } else if (this.sourceWallet) {
        this.logout('sender')
      }
    },

    destinationName() {
      //this.loadUncompletedTransfers()

      if (this.destinationName == this.sourceName) {
        this.sourceName = null
        if (this.step === 4 || this.step === null) this.asset = null
      } else if (this.destinationWallet) {
        this.logout('receiver')
      }
    }
  },

  mounted() {
    // TODO source and destination by query params
    if (this.inProgress && this.asset?.quantity) this.formData.amount = parseFloat(this.asset.quantity)
    if (this.inProgress && !this.error) this.setError('Window was closed')

    this.loadUncompletedTransfers()
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

    loadUncompletedTransfers() {
      //console.log('loadUncompletedTransfers')
      ////if (!this.sourceWallet || !this.destinationWallet) return
      //if (!this.sourceWallet) return

      //const { source, sourceWallet } = this

      //// Load from source

      //console.log('this.sourceWallet.name', sourceWallet.name)

      //const url =
      //  `${source.hyperion}/v2/history/get_actions?account=${tokenRow.wrapLockContract}&filter=${tokenRow.nativeTokenContract}:transfer&transfer.from=${sourceWallet.name}&transfer.memo=${destinationChain.auth.actor}&limit=15`

      //if(tokenRow.native) url = `${sourceChain.hyperion}/v2/history/get_actions?account=${tokenRow.wrapLockContract}&filter=${tokenRow.nativeTokenContract}:transfer&transfer.from=${sourceChain.auth.actor}&transfer.memo=${destinationChain.auth.actor}&limit=15`; //else url = `${sourceChain.hyperion}/v2/history/get_actions?account=${sourceChain.auth.actor}&filter=${tokenRow.pairedWrapTokenContract}:retire&limit=15`;
    },

    resetState() {
      this.$confirm(
        'You current state of transfer will be cleaned. If you have issue with bridge transfer, ask help in telegram chat!',
        'Reset State', {
          confirmButtonText: 'OK',
          cancelButtonText: 'Cancel',
          type: 'warning'
        }).then(() => {
        this.clear()
      }).catch(() => {})
    },

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

      if (data == 'sender') this.sourceWallet?.wallet?.logout()
      if (data == 'receiver') this.destinationWallet?.wallet?.logout()

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
      const { destination, destinationWallet } = this
      const destinationRpc = getMultyEndRpc(Object.keys(destination.client_nodes))

      if (this.error && this.step == 3) {
        // We are trying to generate proofs again
        this.setStep(2)
      }

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

      const ibcTransfer = new IBCTransfer(this.source, this.destination, this.sourceWallet, this.destinationWallet, this.asset, this.updateProgress)

      if (this.step === 0) {
        try {
          // TODO CPU/NET warning probably
          await destinationRpc.get_account(this.destinationWallet.name)
        } catch (e) {
          return this.$notify({ type: 'warning', title: 'Bridge Transfer', message: 'Destination account does not exists' })
        }

        try {
          const signedTx = await ibcTransfer.signSourceTrx()

          const { tx, packedTx } = await ibcTransfer.sourceTransfer(signedTx) // TODO leap

          // TODO Handle if no
          //const emitxferAction = ibcTransfer.findEmitxferAction(tx)
          //console.log('emitxferAction', emitxferAction)

          this.setStep(1)
          this.setTx(tx)
          this.setPackedTx(packedTx)
          this.setResult({ ...this.result, source: tx.transaction_id })
          return await this.transfer()
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
          return await this.transfer()
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
          //const tx = await ibcTransfer.waitForLIB(this.source, this.tx, this.packedTx)

          const last_proven_block = await ibcTransfer.getLastProvenBlock()

          console.log('this.tx', this.tx)
          const scheduleProofs = (await ibcTransfer.getScheduleProofs(this.tx)) || []

          // TODO Popup
          for (const proof of scheduleProofs) {
            await ibcTransfer.submitProofs([proof])
          }

          // We have to push scheduleProofs one by one here
          console.log('scheduleProofs', scheduleProofs)

          const emitxferAction = ibcTransfer.findEmitxferAction(this.tx)
          console.log('emitxferAction', emitxferAction)

          const light = last_proven_block && last_proven_block.block_height > this.tx.processed.block_num
          //const light = false

          console.log({ light })

          // TODO Test lightProof
          const query = {
            type: light ? 'lightProof' : 'heavyProof',
            action: emitxferAction,
            block_to_prove: this.tx.processed.block_num //block that includes the emitxfer action we want to prove
          }

          if (light) query.last_proven_block = last_proven_block.block_height

          const emitxferProof = await ibcTransfer.getProof(query)

          if (light) emitxferProof.data.blockproof.root = last_proven_block.block_merkle_root

          console.log('emitxferProof', emitxferProof)

          //throw new Error('test')

          console.log('setProofs', [emitxferProof])
          //this.setProofs([...scheduleProofs, emitxferProof])

          this.setProofs([emitxferProof])
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
          // TODO Submit schedule separated in case we are limited by time execution like on eos
          console.log('submitProofs...')
          //throw new Error('test')
          const { tx } = await ibcTransfer.submitProofs(this.proofs)
          this.setResult({ ...this.result, destination: tx.transaction_id })
          this.setStep(4)

          console.log('clean error step 3')
          if (this.error) this.setError(null)

          this.asset = null
          this.formData.amount = null
          this.updateProgress(0)
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
        this.loadUncompletedTransfers()
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
  padding: 18px;
  z-index: 100;
  position: relative;

  .network-select,
  .connect-button {
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
.to-mobile {
  display: none;
  justify-content: center;
  padding: 14px 0;
  font-size: 1.5rem;
}
.send-and-receive {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  grid-template-areas:
    "sendFrom . receiveOn"
    "to to to"
    "connect-button-left . connect-button-right";
  .to {
    grid-area: to;
  }
  .send-from{
    grid-area: sendFrom;
  }
  .receive-on{
    grid-area: receiveOn;
  }
  .connect-button-left {
    grid-area: connect-button-left;
  }
  .connect-button-right {
    grid-area: connect-button-right;
  }
}
.transfer-btn {
  width: 240px;
}
.settings {
  position: absolute;
  top: 8px;
  right: 8px;
}
.bridge-setting-dropdown {
  min-width: 140px;
  .alcor-button {
    width: 100%;
  }
}
@media only screen and (max-width: 740px){
  .send-and-receive {
    grid-template-columns: 1fr;
    gap: 4px;
    grid-template-areas:
      "sendFrom"
      "connect-button-left"
      "to"
      "receiveOn"
      "connect-button-right"
  }
  .to-desktop {
    display: none !important;
  }
  .to-mobile {
    display: flex;
  }
  .amount-container{
    gap: 4px;
  }
  .transfer-btn{
    width: 100%;
  }
}
@media only screen and (max-width: 480px){
  .form {
    padding: 16px 8px;
  }
}
</style>

<style lang="scss">
.amount-input {
  position: relative;
  width: 100%;

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
    top: 50%;
    transform: translateY(-50%);
    left: 4px;
    font-size: 14px;
    background: var(--bg-alter-1);
    border: var(--border-1);
    border-radius: 2px;
    color: var(--text-default);
    padding: 2px 4px;
  }

  & .el-input__inner {
    padding-left: 50px !important;
  }
}
</style>
