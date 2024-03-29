<template lang="pug">
div
  h1 staking
  div APR: {{ apr }}

  div(v-if="stakeTokenBalance") Current stake tokens: {{ stakeTokenBalance.amount }} {{ stakeTokenBalance.symbol }}
  div(v-if="receive") Unstake available: {{ receive }}

  hr
  div stake amount
  input(v-model="amount" type="number")
  el-button(@click="stake" type="success" size="small").ml-2 Stake
</template>

<script>
import bigInt from 'big-integer'
import { mapState, mapGetters } from 'vuex'

const multiplier = bigInt(100000000)

export default {
  components: {

  },

  data() {
    return {
      amount: 0,
      stakemints: null
    }
  },

  computed: {
    ...mapGetters(['user']),
    ...mapState(['network']),

    apr() {
      if (!this.stakemints) return 0

      const { totalNativeToken, totalLiquidStakedToken } = this.stakemints
      const apr = (parseFloat(totalNativeToken.quantity) - parseFloat(totalLiquidStakedToken.quantity)) / 100

      return Math.round(apr * 100) / 100
    },

    stakeTokenBalance() {
      return this.$store.getters['wallet/balances'].find(b => b.id == 'lsw-lsw.alcor')
    },

    receive() {
      if (!this.stakeTokenBalance) return 0

      const liquidAmount = bigInt(this.stakeTokenBalance.amount.replace('.', ''))

      const receive = multiplier.times(liquidAmount).divide(this.getExchangeRateX8())

      // getnativeamt
      return receive.toJSNumber() / 10 ** this.network.baseToken.precision
    }
  },

  async mounted() {
    const { rows: [stakemints] } = await this.$rpc.get_table_rows({
      code: this.network.staking.contract,
      scope: this.network.staking.contract,
      table: 'stakemints',
      limit: 1
    })

    this.stakemints = stakemints

    console.log('balances', this.$store.getters['wallet/balances'])
  },

  methods: {
    getExchangeRateX8() {
      let rateX4 = bigInt(1).multiply(multiplier)

      if (this.stakemints) {
        const { totalLiquidStakedToken, totalNativeToken } = this.stakemints
        const amount = bigInt(totalLiquidStakedToken.quantity.split(' ')[0].replace('.', ''))
        const nativeAmount = bigInt(totalNativeToken.quantity.split(' ')[0].replace('.', ''))

        rateX4 = amount.multiply(multiplier).divide(nativeAmount).add(1)
      }

      return rateX4
    },

    async stake() {
      console.log('stake')
      const { contract, token } = this.network.staking
      const { baseToken } = this.network

      await this.$store.dispatch('chain/transfer', {
        to: contract,
        contract: baseToken.contract,
        actor: this.user.name,
        quantity: parseFloat(this.amount).toFixed(baseToken.precision) + ' ' + baseToken.symbol,
        memo: 'stake'
      })

      // refresh after
      this.amount = 0
      // TODO notify success

      // await this.$store.dispatch('chain/transfer', {
      //   to: contract,
      //   contract: token.contract,
      //   actor: this.user.name,
      //   quantity: parseFloat(this.amount).toFixed(token.precision) + ' ' + token.symbol,
      //   memo: 'staking'
      // })
    }
  }
}
</script>

<style scoped lang="scss">
</style>
