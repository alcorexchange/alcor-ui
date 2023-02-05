<template lang="pug">
#bridge-form-component.form
  .d-flex.justify-content-between
    .d-flex.flex-column
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
    .d-flex.flex-column
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

  .d-flex.justify-content-center.align-items-center.gap-30
    i.el-icon-right
    span To
    i.el-icon-right

  .d-flex.justify-content-between
    alcor-button.connect-button(
      :disabled="!sourceName || inProgress"
      @click="connectFromWallet"
    )
      .d-flex.justify-content-between.align-items-center.w-100(v-if="formData.sender")
        .d-flex.align-items-center.gap-8
          img(
            :src='require("~/assets/icons/avatar.png")',
            height=18
          )
          .fs-14 {{ formData.sender }}
        .d-flex.align-items-center.gap-8(@click.stop="formData.sender = null")
          .fs-12 Logout
          i.el-icon-right
      .fs-14(v-else) Connect Wallet

    alcor-button.connect-button(
      :disabled="!destinationName || inProgress"
      @click="connectToWallet"
    )
      .d-flex.justify-content-between.align-items-center.w-100(v-if="formData.receiver")
        .d-flex.align-items-center.gap-8
          img(
            :src='require("~/assets/icons/avatar.png")',
            height=18
          )
          .fs-14 {{ formData.receiver }}
        .d-flex.align-items-center.gap-8(@click.stop="formData.receiver = null")
          .fs-12 Logout
          i.el-icon-right
      .fs-14(v-else) Connect Wallet

  .d-flex.justify-content-between.gap-32.mt-4
    .amount-input
      el-input(type="number" placeholder="Amount" v-model="formData.amount" :disabled="inProgress")
      span.max-btn.pointer(@click="setMax") MAX

    el-select(v-model='formData.asset' value-key="id" filterable :placeholder='$t("Select")' clearable @change="setAsset")
      el-option(
        :label="asset.symbol",
        :value="asset"
        v-for="asset in this.$store.getters['ibcBridge/availableAssets']"
      )
        TokenImage(:src="$tokenLogo(asset.symbol, asset.sourceTokenContract)" height="25")
        //span.ml-3 {{ network.baseToken.symbol + '@' + network.baseToken.contract }}
        span {{ asset.symbol }}

    //el-select(v-model='formData.asset' v-if="user && user.balances"
    //  value-key="id" filterable :placeholder='$t("Select")' clearable @change="setAsset")
    //  el-option(
    //    :label="network.baseToken.symbol + '@' + network.baseToken.contract",
    //    :value="network.baseToken"
    //  )
    //    TokenImage(:src="$tokenLogo(network.baseToken.symbol, network.baseToken.contract)" height="25")
    //    span.ml-3 {{ network.baseToken.symbol + '@' + network.baseToken.contract }}

    //alcor-button.choise-asset-btn(@click="$store.dispatch('modal/assets')")
      .d-flex.justify-content-between.align-items-center.w-100(v-if="formData.asset")
        .d-flex.gap-8.align-items-center
          img(
            :src='require("~/assets/icons/" + formData.asset + ".png")',
            height=16
          )
          .fs-14 {{ assetLabels[formData.asset] }}
        i.el-icon-arrow-down

  .d-flex.justify-content-center.mt-4
    alcor-button.transfer-btn(access :disabled="!isValid || !inProgress" @click="transfer") Transfer and Prove

  bridge-slider(v-if="inProgress" :steps="steps")

  div(v-if="finished")
    .d-flex.justify-content-center.mt-4
      .fs-18 Success! Assets have been bridged!

    .d-flex.justify-content-center.mt-4
      //alcor-button(outline v-if="sourceName && result.source" @click="openInNewTab(monitorTx(result.source, sourceName))")
      alcor-button(outline v-if="sourceName" @click="openInNewTab(monitorTx(result.source, sourceName))")
        img(:src='require(`~/assets/icons/${sourceName}.png`)' height=20)
        | TX Link

      //alcor-button(outline v-if="destinationName && result.destination" @click="openInNewTab(monitorTx(result.destination, destinationName))").ml-5
      alcor-button(outline v-if="destinationName" @click="openInNewTab(monitorTx(result.destination, destinationName))").ml-5
        img(:src='require(`~/assets/icons/${destinationName}.png`)' height=20)
        | TX Link




  //el-button(type="success") asdfasdf
</template>

<script>
import { mapGetters, mapState, mapMutations } from 'vuex'
import { IBCTransfer } from '~/core/ibc.js'

import config from '~/config'

import AlcorSelect from '~/components/AlcorSelect.vue'
import AlcorButton from '~/components/AlcorButton.vue'
import NetworkOption from '~/components/bridge/NetworkOption'
import BridgeSlider from '~/components/bridge/BridgeSlider'

import TokenImage from '~/components/elements/TokenImage'

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

export default {
  components: { AlcorSelect, AlcorButton, NetworkOption, BridgeSlider, TokenImage },
  //props: ['formData'],
  data: () => ({
    inProgress: false,
    finished: false,

    formData: {
      amount: null,
      asset: null,
      sender: null,
      receiver: null
    },

    sourceWallet: null,
    destinationWallet: null,

    result: {
      source: '',
      destination: ''
    },

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
    }],

    steps: [
      { id: 0, progress: 0, label: 'Submitting source chain transfer', status: 'active' },
      { id: 1, progress: 0, label: 'Waiting for Transaction irreversibility', status: 'waiting' },
      { id: 2, progress: 0, label: 'Fetching proof for interchain transfer', status: 'waiting' },
      { id: 3, progress: 0, label: 'Submitting proof(s)', status: 'waiting' }
    ]
  }),

  computed: {
    ...mapState(['network']),
    ...mapGetters(['user', 'knownTokens']),
    ...mapGetters({
      source: 'ibcBridge/source',
      destination: 'ibcBridge/destination'
    }),

    sourceName: {
      set (chain) {
        return this.setSourceName(chain)
      },

      get (chain) {
        return this.$store.state.ibcBridge.sourceName
      }
    },

    destinationName: {
      set (chain) {
        return this.setDestinationName(chain)
      },

      get (chain) {
        return this.$store.state.ibcBridge.destinationName
      }
    },

    isValid() {
      return Object.values(this.formData).every(Boolean)
    }
  },

  methods: {
    ...mapMutations({
      setSourceName: 'ibcBridge/setSourceName',
      setDestinationName: 'ibcBridge/setDestinationName'
    }),

    reset() {
      this.finished = false

      this.steps = [
        { id: 0, progress: 0, label: 'Submitting source chain transfer', status: 'active' },
        { id: 1, progress: 1, label: 'Waiting for transaction irreversibility', status: 'waiting' },
        { id: 2, progress: 0, label: 'Fetching proof for interchain transfer', status: 'waiting' },
        { id: 3, progress: 0, label: 'Submitting proof(s)', status: 'waiting' }
      ]

      this.result = {
        source: '',
        destination: ''
      }
    },

    updateProgress(value) {
      const step = this.steps.find(s => s.status == 'active')
      step.progress = value
    },

    async transfer() {
      if (!this.formData.asset) return
      this.reset()
      this.inProgress = true

      const { asset } = this.formData
      asset.quantity = parseFloat(this.formData.amount).toFixed(4) + ' ' + this.formData.asset.symbol

      const ibcTransfer = new IBCTransfer(this.source, this.destination, this.sourceWallet, this.destinationWallet, asset)

      const sourceTx = await ibcTransfer.signSourceTrx()

      this.$set(this.steps, 0, { id: 0, progress: 100, label: 'Submitting source chain transfer', status: 'success' })
      this.$set(this.steps, 1, { id: 1, progress: 1, label: 'Waiting for transaction irreversibility', status: 'active' })

      let prog = 1
      const progressInterval = setInterval(() => {
        prog = Math.min(prog + 1, 100)
        this.updateProgress(prog)
      }, 1500)

      const { result, emitxferAction } = await ibcTransfer.sourceTransferAndWaitForLIB(sourceTx)
      this.result.source = result.transaction_id

      console.log('source result')

      clearInterval(progressInterval)

      this.$set(this.steps, 1, { id: 1, progress: 100, label: 'Waiting for Transaction irreversibility', status: 'success' })
      this.$set(this.steps, 2, { id: 2, progress: 0, label: 'Fetching proof for interchain transfer', status: 'active' })

      //console.log({
      //  result: JSON.stringify(result),
      //  emitxferAction: JSON.stringify(emitxferAction)
      //})

      const scheduleProofs = await ibcTransfer.getScheduleProofs(result)

      const emitxferProof = await ibcTransfer.getProof({
        type: 'heavyProof',
        action: emitxferAction,
        block_to_prove: result.processed.block_num, //block that includes the emitxfer action we want to prove
        onProgress: this.updateProgress
      })

      this.$set(this.steps, 2, { id: 2, progress: 0, label: 'Fetching proof for interchain transfer', status: 'success' })
      this.$set(this.steps, 3, { id: 3, progress: 0, label: 'Submitting proof(s)', status: 'active' })

      const destinationResult = await ibcTransfer.submitProof([...scheduleProofs, emitxferProof])
      this.result.destination = destinationResult.transaction_id

      console.log('destinationResult', destinationResult)

      this.$set(this.steps, 3, { id: 3, progress: 0, label: 'Submitting proof(s)', status: 'success' })

      await sleep(1000)

      this.inProgress = false
      this.finished = true
    },

    setAsset(asset) {
      console.log(this.formData.asset)
    },

    setMax() {

    },

    makeError() {
      this.steps[1].status = 'error'
      this.steps[1].message = 'TX not approved'
    },

    async connectFromWallet() {
      try {
        const { wallet, name, authorization } = await this.$store.dispatch('chain/asyncLogin', {
          chain: this.sourceName
        })

        this.formData.sender = name
        this.sourceWallet = { wallet, name, authorization }
      } catch (e) {
        this.$notify({ type: 'warning', title: 'Wallet connect', message: e })
      }
    },

    async connectToWallet () {
      try {
        console.log('source', this.sourceWallet.wallet.rpc.currentEndpoint)
        const { wallet, name, authorization } = await this.$store.dispatch('chain/asyncLogin', {
          chain: this.destinationName
        })

        this.formData.receiver = name
        this.destinationWallet = { wallet, name, authorization }
        console.log('source', this.sourceWallet.wallet.rpc.currentEndpoint)
      } catch (e) {
        this.$notify({ type: 'warning', title: 'Wallet connect', message: e })
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
  width: 720px;
  margin: 0 auto;
  padding: 32px;
  z-index: 100;

  .transfer-btn {
    width: 312px;
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
