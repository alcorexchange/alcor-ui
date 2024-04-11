<template lang="pug">
.staking-page.pt-5
  .left
    StakingContent

  .page-content
    AlcorContainer.alcor-container

      h2.pt-1 Earn LSW

      StakingTabs(v-model="activeTab").mt-3

      div(v-if="activeTab === 'stake'" key="stake")
        TokenInput(:locked="true" label="Stake Amount" :token="network.baseToken" v-model="amount").mt-4
        TokenInput(:locked="true" :readonly="true" label="Receive" :token="network.staking.token" :value="stakeReceive").mt-2

        .action.pt-2.pb-2
          AuthOnly
            AlcorButton(@click="stake" access class="action-button")
              span.fs-18 Stake

      div(v-else key="unstake")
        TokenInput(:locked="true" label="Unstake Amount" :token="network.staking.token" v-model="unstakeAmount").mt-4
        UnstakeModeSelect(:selected="unstakeMode"  :delayedReceive="receive" :swapReceive="0" @change="unstakeMode = $event")
        //- TokenInput(:locked="true" :readonly="true" label="Receive" :token="network.baseToken" :value="receive").mt-2

        //- ElAlert.mt-4(title="Withdrawals require a minimum of 3 days to process. If the contract lacks sufficient funds at the time of your request, please allow 3 to 6 days for the completion of batch unstakes to replenish the balance. We're continuously working on enhancing this process for efficiency. In instances where additional funds are staked during your withdrawal period, these may be utilized to expedite your transaction." type="info" :closable="false")

        .action.pt-2.pb-2
          AuthOnly
            AlcorButton(@click="unstake" access class="action-button")
              span.fs-18 Unstake

      .stats.my-2.fs-14
        .stat-item
          .muted Rate
          .value {{ rate }} WAX per LSW
        .stat-item
          .muted APR
          .value {{ apr }}%
        .stat-item
          .muted TVL
          .value
            span.muted.small ( {{ $systemToUSD(tvl) }}$ )
            span &nbsp; {{ tvl }}

</template>

<script>
import bigInt from 'big-integer'
import { mapState, mapGetters } from 'vuex'
import PageHeader from '@/components/amm/PageHeader'
import AlcorContainer from '@/components/AlcorContainer'
import AlcorButton from '@/components/AlcorButton'
import TokenInput from '@/components/amm/PoolTokenInput'
import StakingTabs from '@/components/staking/StakingTabs'
import StakingContent from '@/components/staking/StakingContent'
import UnstakeModeSelect from '@/components/staking/UnstakeModeSelect'
import AuthOnly from '@/components/AuthOnly'

const multiplier = bigInt(100000000)

export default {
  components: {
    PageHeader,
    AlcorContainer,
    AlcorButton,
    TokenInput,
    StakingTabs,
    StakingContent,
    UnstakeModeSelect,
    AuthOnly,
  },

  data() {
    return {
      amount: null,
      unstakeAmount: null,
      stakemints: null,
      activeTab: 'stake', // possible values: stake, unstake
      unstakeMode: 'instant', // delayed
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
      if (!this.unstakeAmount) return 0

      const liquidAmount = bigInt(
        parseFloat(this.unstakeAmount).toFixed(this.network.staking.token.precision).replace('.', '')
      )

      const receive = multiplier.times(liquidAmount).divide(this.getExchangeRateX8())

      // getnativeamt
      return receive.toJSNumber() / 10 ** this.network.baseToken.precision
    },

    tvl() {
      if (!this.stakemints) return 0
      return this.stakemints.totalNativeToken.quantity
    },

    rate() {
      if (!this.stakemints) return null

      const { totalNativeToken, totalLiquidStakedToken } = this.stakemints

      return (
        Math.round((parseFloat(totalNativeToken.quantity) / parseFloat(totalLiquidStakedToken.quantity)) * 1000) / 1000
      )
    },

    stakeReceive() {
      if (!this.amount) return ''
      return (this.amount / this.rate).toFixed(this.network.staking.token.precision)
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

      console.log('Receive ---->', this.receive, 'Unstake Amount ---->', this.unstakeAmount)

      if (!this.unstakeAmount) return

      try {
        await this.$store.dispatch('chain/transfer', {
          to: contract,
          contract: token.contract,
          actor: this.user.name,
          // TODO: Should we use `receive` or `stakeTokenBalance.amount` ? We are supposed to use `this.unstakeAmount`.
          quantity: parseFloat(this.unstakeAmount).toFixed(token.precision) + ' ' + token.symbol,
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
  display: grid;
  grid-template-columns: 1fr 480px;
  gap: 80px;
  margin: auto;

  .alcor-container {
    padding: 14px !important;
  }

  h1 {
    font-size: 24px;
    span {
      color: var(--main-green);
      padding: 0;
    }
  }

  .stats {
    display: flex;
    flex-direction: column;
    gap: 8px;
    .stat-item {
      display: flex;
      justify-content: space-between;
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
    .auth-only {
      flex: 1;
    }
  }

  @media only screen and (max-width: 600px) {
    .stats {
      grid-template-columns: 1fr;
    }
  }
  @media only screen and (max-width: 980px) {
    display: flex;
    flex-direction: column-reverse;
    .page-content {
      width: 100%;
      max-width: 480px;
      margin: auto;
    }
  }
}
</style>
