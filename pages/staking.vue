<template lang="pug">
.staking-page.pt-5
  AlcorContainer
    PageHeader(title="Staking")
      template(#end) &nbsp;
    .page-content
      h1.pt-3
        | Stake
        span.symbol  WAX
        |  to earn
        span.symbol  LSW

      .stats.mt-3
        .stat-container
          .stat-title.muted APR
          .stat-value {{ apr }}%
        .stat-container
          .stat-title.muted
            div TVL &nbsp;
            div.muted.small ( {{ $systemToUSD(tvl) }}$ )
          .stat-value {{ tvl }}

      .stat-container.mt-3(v-if="stakeTokenBalance")
        .stat-title.muted Current Stake Balance
        .stat-value {{ stakeTokenBalance.amount }} {{ stakeTokenBalance.symbol }}

      .recieve.mt-5.mb-4(v-if="receive")
        .muted Available to Unstake:
        .end
          div {{ receive }} {{ network.baseToken.symbol }}
          AlcorButton(@click="stake") Unstake
      //- div( @click="unstake") Available to Unstake: {{ receive }} {{ network.baseToken.symbol }}
      //-   el-button(size="mini" type="success").ml-2 unstake

      TokenInput(:locked="true" label="Stake Amount" :token="network.baseToken" v-model="amount")
      .action.pt-2.pb-2
        AlcorButton(@click="stake" access)
          span.fs-18 Stake
</template>

<script>
import bigInt from 'big-integer'
import { mapState, mapGetters } from 'vuex'
import PageHeader from '@/components/amm/PageHeader'
import AlcorContainer from '@/components/AlcorContainer'
import AlcorButton from '@/components/AlcorButton'
import TokenInput from '@/components/amm/PoolTokenInput'

const multiplier = bigInt(100000000)

export default {
  components: {
    PageHeader,
    AlcorContainer,
    AlcorButton,
    TokenInput,
  },

  data() {
    return {
      amount: null,
      stakemints: null,
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
      return this.$store.getters['wallet/balances'].find((b) => b.id == 'lsw-lsw.alcor')
    },

    receive() {
      if (!this.stakeTokenBalance) return 0

      const liquidAmount = bigInt(this.stakeTokenBalance.amount.replace('.', ''))

      const receive = multiplier.times(liquidAmount).divide(this.getExchangeRateX8())

      // getnativeamt
      return receive.toJSNumber() / 10 ** this.network.baseToken.precision
    },

    tvl() {
      if (!this.stakemints) return 0
      return this.stakemints.totalNativeToken.quantity
    },
  },

  mounted() {
    this.fetchStakeMints()
  },

  methods: {
    async fetchStakeMints() {
      const {
        rows: [stakemints],
      } = await this.$rpc.get_table_rows({
        code: this.network.staking.contract,
        scope: this.network.staking.contract,
        table: 'stakemints',
        limit: 1,
      })

      this.stakemints = stakemints
    },

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

      if (!this.amount) return

      try {
        await this.$store.dispatch('chain/transfer', {
          to: contract,
          contract: baseToken.contract,
          actor: this.user.name,
          quantity: parseFloat(this.amount).toFixed(baseToken.precision) + ' ' + baseToken.symbol,
          memo: 'stake',
        })
        this.amount = null
        this.fetchStakeMints()
      } catch (e) {
        this.$notify({ type: 'error', title: 'Stake Error', message: e.message })
      }
    },

    async unstake() {
      console.log('stake')
      const { contract, token } = this.network.staking

      try {
        await this.$store.dispatch('chain/transfer', {
          to: contract,
          contract: token.contract,
          actor: this.user.name,
          quantity: parseFloat(this.receive).toFixed(token.precision) + ' ' + token.symbol,
          memo: 'withdraw',
        })
        this.amount = null
        this.fetchStakeMints()
      } catch (e) {
        this.$notify({ type: 'error', title: 'Stake Error', message: e.message })
      }
    },
  },
}
</script>

<style scoped lang="scss">
.staking-page {
  max-width: 540px;
  margin: auto;

  .page-content {
    padding: 0 8px;
  }

  h1 {
    font-size: 24px;
    span {
      color: var(--main-green);
      padding: 0;
    }
  }

  .stats {
    display: grid;
    gap: 20px;
    grid-template-columns: 1fr 1fr;
  }
  .stat-container {
    box-shadow: 0 0 0 1px var(--bg-alter-2);
    border-radius: 6px;
    padding: 8px 12px;
    display: flex;
    flex-direction: column;
    flex: 1;
    justify-content: space-between;
    // background: var(--background-color-base);
    .stat-title {
      font-size: 16px;
      display: flex;
      align-items: center;
    }
    .stat-value {
      font-size: 24px;
      font-weight: bold;
    }
  }

  .recieve {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
    .end {
      display: flex;
      align-items: center;
      gap: 8px;
    }
  }
  .divider {
    border-bottom: 1px solid var(--border-color);
    margin: 20px 0;
    display: flex;
    width: 100%;
  }
  .action {
    display: flex;
    .alcor-button {
      --main-action-green: var(--main-green);
      padding: 8px 20px;
      font-weight: bold;
      width: 100%;
    }
  }

  @media only screen and (max-width: 600px) {
    .stats {
      grid-template-columns: 1fr;
    }
  }
}
</style>
