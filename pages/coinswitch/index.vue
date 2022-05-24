<template lang="pug">
.row.mt-4
  .col-5.m-auto.swap-pools
    el-card
      .row
        .col
          .d-flex.mb-1
            small.text-muted Send

            //el-button(type="text" size="mini" @click="inputAmount = parseFloat(inputBalance)").ml-auto {{ inputBalance }}
              i.el-icon-wallet.ml-1

          SelectCoin(v-model="inputAmount" :tokens="depositCoins" :token="input" @change="tokenChanged(0)")
            template(slot="end")
              .pair(@click="$router.push('/swap/create')").text-muted
                i.el-icon-plus.mr-2
                span Create pool

      .row.mt-3
        .col.text-center
          i.el-icon-bottom.lead.pointer(@click="toggleInputs")
      .row.mt-1
        .col
          .d-flex.mb-1
            small.text-muted Estimated Get
            //small.text-mutted.small.ml-auto {{ outputBalance }}
              i.el-icon-wallet.ml-1

          SelectCoin(v-model="outputAmount" :tokens="['eos']" readonly :token="output" static)
            template(slot="end")
              .pair(@click="$router.push('/swap/create')").text-muted
                i.el-icon-plus.mr-2
                span Create pool

      //.row.mt-4(v-if="output && ibcChain")
        .col
          el-form(:model="ibcForm" :rules="rules" ref="form")
            el-form-item.mb-2
              el-switch(v-model="ibcForm.transfer" active-text="Swap & Transfer")

            .multi-input-wrapper(v-if="ibcForm.transfer").mt-4
              el-form-item(prop="address").mb-0
                el-input(v-model="ibcForm.address" clearable :placeholder="`Recipient's ${output.symbol} Address`")

      .row.mt-4
        .col
          PleaseLoginButton
            div(v-loading="loading")
              .div(v-if="(input && inputAmount) && (output && outputAmount)")
                el-button(type="primary" @click="submit").w-100 Swap {{ input.symbol }} to {{ output.symbol }}
              .div(v-else)
                el-button(type="primary" disabled).w-100 Select amounts

      //.row.mt-3
        .col
          .d-flex.justify-content-between
            small Minimum Received
            .small {{ minOutput }}

          .d-flex.justify-content-between
            small Rate
            .small {{ price }}

          .d-flex.justify-content-between
            small Price Impact
            .small(v-if="priceImpact >= 5").text-danger.font-weight-bold {{ priceImpact}}%
            .small(v-else-if="priceImpact >= 2").text-warning.font-weight-bold {{ priceImpact}}%
            .small(v-else-if="priceImpact < 2").text-success.font-weight-bold {{ priceImpact}}%
            .small(v-else).font-weight-bold {{ priceImpact}} %

          .d-flex.justify-content-between
            small Slippage
            .small 3%

          .d-flex.justify-content-between
            small Liquidity Source Fee
            .small {{ fee }}%

</template>

<script>
//import BigInt from 'big-integer'
//import { asset, symbol } from 'eos-common'
import { mapState, mapGetters } from 'vuex'
//import { get_amount_out, get_amount_in } from '~/utils/pools'
import { isAccountExists } from '~/utils/account'

//import config from '~/config'

import PleaseLoginButton from '~/components/elements/PleaseLoginButton'
import SelectCoin from '~/components/coinswitch/SelectCoin.vue'

export default {
  components: {
    SelectCoin,
    PleaseLoginButton
  },

  data() {
    return {
      loading: false,

      input: 'eth',
      output: 'eos',

      inputAmount: 0.0,
      outputAmount: 0.0,

      minOutput: '0.0000',

      rules: {
        address: {
          trigger: 'blur',
          validator: async (_rule, value, callback) => {
            if (value == '') return callback()
            this.loading = true
            const exists = await isAccountExists(value, this.network)
            this.loading = false

            if (exists) {
              this.ibcForm.valid = true
              callback()
            } else {
              this.ibcForm.valid = false
              callback(new Error('Account doesn\'t exist!'))
            }
          }
        }
      }
    }
  },

  computed: {
    ...mapGetters('coinswitch', ['depositCoins']),
    ...mapState(['network', 'user'])
  },

  watch: {
  },

  methods: {
    toggleInputs() {

    }
    //try {
    //  await this.$store.dispatch('chain/sendTransaction', actions)
    //  this.$store.dispatch('swap/updatePair', this.pair.id)
    //  setTimeout(() => this.$store.dispatch('loadUserBalances'), 1000)

    //  this.inputAmount = Number(0).toFixed(this.input.precision)
    //  this.outputAmount = Number(0).toFixed(this.output.precision)

    //  this.$notify({ title: 'Swap', message: 'Success', type: 'success' })
    //} catch (e) {
    //  this.$notify({ title: 'Swap error', message: 'message' in e ? e.message : e, type: 'error' })
    //} finally {
    //  this.loading = false
    //}
  }
}
</script>

<style lang="scss">
.theme-dark {
  .swap-pools {
    .el-switch__core {
      background: #484848;
    }
  }
}

.swap-pools {
  .el-card {
    overflow: visible;
  }

  .el-form-item__error {
    top: -32px;
    left: -5px;
  }

}
</style>
