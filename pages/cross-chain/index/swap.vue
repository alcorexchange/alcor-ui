<template lang="pug">
el-card
  .lead Cross-Chain token swap.
  span No-fee, fully decentralized(Yes. no gateway)
  hr

  .row
    .col-4
      el-input.input-with-select(placeholder='Amount', v-model='input' clearable @change="updateReceive")
        div(slot='prepend')
          TokenImage(:src="$tokenLogo(network.baseToken.symbol, network.baseToken.contract)" height="25")
          span {{ network.baseToken.symbol }}

      .width-100.text-center.mt-1
        .el-icon-bottom

      el-radio-group(v-model='output_chain' @change="setChain" size="small").el-radio-full-width.mt-2
        el-radio-button(v-for="chain in chains" :key='chain', :value='chain' :label='chain')
          img(:src="require('~/assets/icons/' + chain + '.png')" height=20).mr-2
          span {{ chain }}

      hr
      .span.w-100
        b.text-muted Receive: 1.3242 TELOS

      hr
      el-input(placeholder='Account name', v-model='input3')

      PleaseLoginButton
        el-button(type="primary").w-100.mt-2 Swap

  //TokenImage(:src="$tokenLogo(network.baseToken.symbol, network.baseToken.contract)" height="50").ml-2
  //span {{ network.baseToken.symbol }}@{{ network.baseToken.contract }}
</template>

<script>
import { mapGetters, mapState } from 'vuex'

import { asset, number_to_asset } from 'eos-common'
import { computeForward } from '~/utils/pools'
import PleaseLoginButton from '~/components/elements/PleaseLoginButton'
import TokenImage from '~/components/elements/TokenImage'
import config from '~/config'

// const PEGS = {
//   telos: 'EOSTLOS',
//   wax: 'EOSWAX'
// }

export default {
  components: {
    TokenImage,
    PleaseLoginButton
  },

  data() {
    return {
      output_chain: 'telos',
      input: 0.0,
      receive: 0.0
    }
  },

  computed: {
    ...mapGetters(['user']),
    ...mapGetters('pools', ['current', 'baseBalance', 'quoteBalance']),
    ...mapState(['network']),
    ...mapState('pools', ['pools']),

    networks() {
      return Object.values(config.networks)
    },

    chains() {
      //return ['eos', 'bos', 'telos', 'wax'].filter(c => c != this.network.name)
      return ['eos', 'telos', 'wax'].filter(c => c != this.network.name)
      //return ['telos'].filter(c => c != this.network.name)
    },

    pool() {
      //return this.pools.filter(PEGS[this.output_chain])
      return {}
    }
  },

  methods: {
    updateReceive() {
      const p1 = this.pool.pool1.quantity.amount
      const p2 = this.pool.pool2.quantity.amount

      let a = (parseFloat(this.input) || 0).toFixed(p1.quantity.symbol.precision())
      a = asset(a + ' ' + p1.quantity.symbol.code().to_string()).amount

      const r = number_to_asset(0, p2.quantity.symbol)
      r.set_amount(Math.abs(computeForward(a.multiply(-1), p2, p1.plus(a), this.current.fee)))
      this.amount2 = r.to_string().split(' ')[0]
    }
  },

  setChain(chain) {
    this.chain = chain
  }
}

</script>
