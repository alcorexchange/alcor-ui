<template lang="pug">
.row
  .col
    .title.fs-18.fw-bold.d-flex.align-items-center.gap-10.mb-4 Create Pool

    .row
      .col
        .fs-12.text-muted.p-1 TokenA
        alcor-select.network-select(v-model="tokenA" value-key="currency" placeholder="Token A" filterable)
          template(slot="empty")
            .small.muted.text-center Chose Send & Receive

          template(slot="prefix" v-if="tokenA")
            TokenImage(:src="$tokenLogo(tokenA.currency, tokenA.contract)" height="20")

          alcor-option(:value="asset" :label="asset.currency" v-for="asset in availableAssets")
            .d-flex.align-items-center.w-100
              TokenImage(:src="$tokenLogo(asset.currency, asset.contract)" height="20")
              .ml-2 {{ asset.currency }}

        hr

        .fs-12.text-muted.p-1 TokenA amount
        el-input(v-model="amountA" type="number" placeholder="tokenA")

      .col
        .fs-12.text-muted.p-1 TokenB
        alcor-select.network-select(v-model="tokenB" value-key="currency" placeholder="Token A" filterable)
          template(slot="empty")
            .small.muted.text-center Chose Send & Receive

          template(slot="prefix" v-if="tokenB")
            TokenImage(:src="$tokenLogo(tokenB.currency, tokenB.contract)" height="20")

          alcor-option(:value="asset" :label="asset.currency" v-for="asset in availableAssets")
            .d-flex.align-items-center.w-100
              TokenImage(:src="$tokenLogo(asset.currency, asset.contract)" height="20")
              .ml-2 {{ asset.currency }}

        hr

        .fs-12.text-muted.p-1 TokenB amount
        el-input(v-model="amountB" type="number" placeholder="tokenA")

    hr
    .d-flex
      .fs-20.disable.p-1 Price:
      .fs-20.p-1(v-if="tokenB") 1 {{ tokenA.currency }} = {{ price }} {{ tokenB.currency }}
    hr

    .row.mt-1
      .col
        .fs-14.disable.p-1 Select Fee
        el-radio-group.el-radio-full-width.el-radio-group(v-model='fee' size='small').w-100
          el-radio-button(label='0.05%')
          el-radio-button(label='0.3%')
          el-radio-button(label='1%')
    .mt-3
      alcor-button.w-100(@click="create" outline) Create

</template>

<script>
import { mapState } from 'vuex'

import { asset, Sym } from 'eos-common'

import { mapActions } from 'vuex'
import TokenSelect from '~/components/TokenSelect'

import AlcorButton from '~/components/AlcorButton'
import TokenImage from '~/components/elements/TokenImage'

import AlcorSelect from '~/components/alcor-element/select/select'
import AlcorOption from '~/components/alcor-element/select/option'

import { encodeSqrtRatioX64 } from '~/assets/libs/swap-sdk'

export default {
  components: { AlcorSelect, AlcorOption, TokenSelect, AlcorButton, TokenImage },

  data: () => ({
    tokenA: null,
    tokenB: null,

    amountA: 0,
    amountB: 0,

    fee: null,

    fees: {
      '0.05%': 500,
      '0.3%': 3000,
      '1%': 10000
    }
  }),

  computed: {
    ...mapState(['user', 'network']),

    availableAssets() {
      return this.$store.state.user?.balances || []
    },

    price() {
      if (!this.amountA || !this.amountB) return 0

      return (this.amountB / this.amountA).toFixed(8)
    }
  },

  methods: {
    ...mapActions('modal', ['createPool']),

    async create() {
      if (![this.amountA, this.amountB, this.tokenA, this.tokenB, this.fee, this.user?.name].every(Boolean))
        return this.$notify({ type: 'warning', title: 'Fill all inputs' })

      //const assetA = asset(parseFloat(this.amountA).toFixed(this.tokenA.decimals) + ' ' + this.tokenA.currency)
      //const assetB = asset(parseFloat(this.amountB).toFixed(this.tokenB.decimals) + ' ' + this.tokenB.currency)

      const assetA = asset(parseFloat(this.amountA).toFixed(this.tokenA.decimals) + ' ' + this.tokenA.currency)
      const assetB = asset(parseFloat(this.amountB).toFixed(this.tokenB.decimals) + ' ' + this.tokenB.currency)

      const sqrtPriceX64 = encodeSqrtRatioX64(assetA.amount, assetB.amount).toString()

      // FOR NOW CREATION ONLY WITH 0 AMOUNT
      assetA.set_amount(0)
      assetB.set_amount(0)

      const data = {
        account: this.$store.state.user.name,
        tokenA: { contract: this.tokenA.contract, quantity: assetA.to_string() },
        tokenB: { contract: this.tokenB.contract, quantity: assetB.to_string() },
        sqrtPriceX64,
        fee: this.fees[this.fee]
      }

      console.log('data', data)

      const result = await this.$store.dispatch('chain/sendTransaction', [{
        account: this.network.amm.contract,
        name: 'createpool',
        authorization: [this.user.authorization],
        data
      }])

      console.log('result', result)
    },
    openPreviewLiqidityModal() {
      const { outputToken, inputToken, inputAmount, outputAmount, selectedFee, maxPrice, minPrice, fees, inRange } = this

      this.createPool({
        inputToken,
        outputToken,
        inputAmount,
        outputAmount,
        selectedFee,
        maxPrice,
        minPrice,
        fees,
        inRange
      })
    }
  }
}
</script>

<style lang="scss">
.create-pool-component {
  width: 1000px;

  .left {
    width: 587px;
  }

  .fee {
    width: 185px;
    height: 156px;
    padding: 16px 24px;
    cursor: pointer;

    background: rgba(60, 60, 67, 0.36);

    border: 1px solid rgba(120, 120, 135, 0.36);
    border-radius: 4px;

    &.active {
      border: 1px solid #67C23A;
      background: #161617;
    }
  }
}
</style>
