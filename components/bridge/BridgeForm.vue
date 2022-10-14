<template lang="pug">
#bridge-form-component.form
  .d-flex.justify-content-between
    .d-flex.flex-column
      .mb-3 Send from
      alcor-select.network-select(
        :options="fromNetworkOptions"
        :value.sync="formData.fromNetwork"
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
        :value.sync="formData.toNetwork"
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
      :disabled="!formData.fromNetwork"
      @click="$store.dispatch('modal/login', { ibcClient: 'sender' })"
    )
      .d-flex.justify-content-between.align-items-center.w-100(v-if="formData.sender")
        .d-flex.align-items-center.gap-8
          img(
            :src='require("~/assets/icons/avatar.png")',
            height=18
          )
          .fs-14 {{ formData.sender.name }}
        .d-flex.align-items-center.gap-8(@click.stop="$store.dispatch('chain/logOutIBCClient', 'sender')")
          .fs-12 Logout
          i.el-icon-right
      .fs-14(v-else) Connect Wallet

    alcor-button.connect-button(
      :disabled="!formData.toNetwork"
      @click="$store.dispatch('modal/login', { ibcClient: 'receiver' })"
    )
      .d-flex.justify-content-between.align-items-center.w-100(v-if="formData.receiver")
        .d-flex.align-items-center.gap-8
          img(
            :src='require("~/assets/icons/avatar.png")',
            height=18
          )
          .fs-14 {{ formData.receiver.name }}
        .d-flex.align-items-center.gap-8(@click.stop="$store.dispatch('chain/logOutIBCClient', 'receiver')")
          .fs-12 Logout
          i.el-icon-right
      .fs-14(v-else) Connect Wallet

  .d-flex.justify-content-between.gap-32.mt-4
    .amount-input
      el-input(placeholder="Amount" v-model="formData.amount")
      span.max-btn.pointer MAX
    alcor-button.choise-asset-btn(@click="$store.dispatch('modal/assets')")
      .d-flex.justify-content-between.align-items-center.w-100(v-if="formData.asset")
        .d-flex.gap-8.align-items-center
          img(
            :src='require("~/assets/icons/" + formData.asset + ".png")',
            height=16
          )
          .fs-14 {{ assetLabels[formData.asset] }}
        i.el-icon-arrow-down
  .d-flex.justify-content-center.mt-4
    alcor-button.transfer-btn(access :disabled="!isValid" @click="inProgress = true") Transfer and Prove
  bridge-slider(v-if="inProgress" :steps="steps")
</template>

<script>
import AlcorSelect from '~/components/AlcorSelect.vue'
import AlcorButton from '~/components/AlcorButton.vue'
import NetworkOption from '~/components/bridge/NetworkOption'
import BridgeSlider from '~/components/bridge/BridgeSlider'

export default {
  components: { AlcorSelect, AlcorButton, NetworkOption, BridgeSlider },
  props: ['formData'],
  data: () => ({
    inProgress: false,
    assetLabels: {
      usdt: 'USDT',
      wax: 'WAXP',
      eos: 'EOS',
      matic: 'MATIC',
      pbtc: 'pBTC',
      weth: 'WETH',
      sol: 'SOL',
      usdc: 'USDC'
    },
    fromNetworkOptions: [{
      value: 'eos',
      label: 'EOS'
    }, {
      value: 'wax',
      label: 'WAX'
    }, {
      value: 'proton',
      label: 'Proton'
    }, {
      value: 'telos',
      label: 'Telos'
    }, {
      value: 'bos',
      label: 'BOS'
    }],

    steps: [
      { id: 0, progress: 100, label: 'Waiting for Transaction irreversibility', status: 'success' },
      { id: 1, progress: 50, label: 'Fetching proof for interchain transfer', status: 'active' },
      { id: 2, progress: 0, label: 'Submitting proof(s)', status: 'waiting' },
      { id: 3, progress: 0, label: 'Finalizing', status: 'waiting' }
    ]
  }),
  computed: {
    isValid() {
      return Object.values(this.formData).every(Boolean)
    }
  },
  methods: {
    makeError() {
      this.steps[1].status = 'error'
      this.steps[1].message = 'TX not approved'
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
