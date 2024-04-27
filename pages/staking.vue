<template lang="pug">
.staking-page.pt-5
  .left
    StakingContent

  .page-content
    AlcorContainer.alcor-container

      .stake-title
        h2.pt-1 Earn LSW
        .pale.hover-opacity.pointer.disable.fs-14(@click="togglePending")
          .history-button.p-1(v-if="isOnPending")
            i.el-icon-back
            span Back
          ElBadge(v-else-if="pendingUnstakes.length" type="warning" :value="pendingUnstakes.length")
            .history-button.p-1
              span Pending Unstakes

      PendingUnstake(v-if="$route.query.pending" :unstakes="pendingUnstakes")

      template(v-else)

        StakingTabs(v-model="activeTab").mt-3

        div(v-if="activeTab === 'stake'" key="stake")
          TokenInput(:locked="true" label="Stake Amount" :token="network.baseToken" v-model="amount" @input="onInputInAmount").mt-4
          TokenInput(:locked="true" :readonly="true" label="Receive" :token="network.staking.token" :value="stakeReceiveAmount").mt-2

          .action.pt-2.pb-2
            AuthOnly
              AlcorButton.action-button(@click="stake" access :class="{disabled: stakeSubmitDisabled}" :disabled="stakeSubmitDisabled")
                i.el-icon-refresh.rotate-reverse.h-fit.fs-20(v-if="stakeLoading")
                span.fs-16 {{ renderStakeSubmitText }}

        div(v-else key="unstake")
          TokenInput(:locked="true" label="Unstake Amount" :token="network.staking.token" v-model="unstakeAmount" @input="onUnstakeAmountInput").mt-4
          UnstakeModeSelect(
            :selected="unstakeMode"
            :delayedReceive="receive"
            :swapReceive="swapReceiveAmount"
            :loading="loading"
            :priceImpact="priceImpact"
            :network="network"
            @change="unstakeMode = $event"
          )
          //- TokenInput(:locked="true" :readonly="true" label="Receive" :token="network.baseToken" :value="receive").mt-2

          //- ElAlert.mt-4(title="Withdrawals require a minimum of 3 days to process. If the contract lacks sufficient funds at the time of your request, please allow 3 to 6 days for the completion of batch unstakes to replenish the balance. We're continuously working on enhancing this process for efficiency. In instances where additional funds are staked during your withdrawal period, these may be utilized to expedite your transaction." type="info" :closable="false")

          .action.pt-2.pb-2
            AuthOnly
              AlcorButton(access class="action-button" @click="handleUnstakeClick" :disabled="unstakeSubmitDisabled")
                span.fs-16  {{ renderUnstakeSubmitText }}

        .stats.my-2.fs-14
          .stat-item
            .muted Rate
            .value {{ rate }} LSW per WAX
          .stat-item
            .muted APR
            .value ~{{ apr }}%
          .stat-item
            .muted TVL
            .value
              span.muted.small ( {{ $systemToUSD(tvl) }}$ )
              span &nbsp; {{ tvl | commaFloat }}

</template>

<script>
import { Token, CurrencyAmount } from '@alcorexchange/alcor-swap-sdk'

import { debounce } from 'lodash'
import { mapState, mapGetters } from 'vuex'
import PageHeader from '@/components/amm/PageHeader'
import AlcorContainer from '@/components/AlcorContainer'
import AlcorButton from '@/components/AlcorButton'
import TokenInput from '@/components/amm/PoolTokenInput'
import StakingTabs from '@/components/staking/StakingTabs'
import StakingContent from '@/components/staking/StakingContent'
import UnstakeModeSelect from '@/components/staking/UnstakeModeSelect'
import PendingUnstake from '@/components/staking/PendingUnstake'
import AuthOnly from '@/components/AuthOnly'
import { tryParseCurrencyAmount } from '~/utils/amm'
import { getPrecision } from '~/utils'
import { fetchAllRows } from '~/utils/eosjs'

const multiplier = BigInt(100000000)

export default {
  components: {
    PageHeader,
    AlcorContainer,
    AlcorButton,
    TokenInput,
    StakingTabs,
    StakingContent,
    UnstakeModeSelect,
    PendingUnstake,
    AuthOnly,
  },

  head() {
    const network = this.network.name.toUpperCase()
    const stakingSymbol = this.tokenA.symbol
    return {
      title: `Alcor Exchange | ${network} | Earn crypto rewards with on-chain staking with ${stakingSymbol}`,
      meta: [
        {
          hid: 'description',
          name: 'description',
          content:
            'Earn hourly interests by depositing assets to Alcor staking fun. Alcor On-chain Earn provides diverse DeFi products to earn juicy on-chain rewards.',
        },
      ],
    }
  },

  data() {
    return {
      // amount of stake
      amount: null,
      // calculated amount of unstake
      //stakeReceiveAmount: null,
      // loading state of stake
      stakeLoading: false,

      exchangerateUp: null,
      exchangerateDown: null,

      // amount of unstake
      unstakeAmount: null,
      // calculated amount of swap unstake
      swapReceiveAmount: null,
      // loading of unstake
      loading: false,
      expectedInput: null,

      stakemints: null,
      priceImpact: '0.00',
      activeTab: 'stake', // possible values: stake, unstake
      unstakeMode: 'delayed', // instant ,delayed
      memo: '',
      market: null,

      pendingUnstakes: [],
    }
  },

  computed: {
    ...mapGetters(['user']),
    ...mapState(['network']),
    ...mapState('amm', ['maxHops']),
    ...mapGetters('amm', ['slippage']),

    apr() {
      // Fixed APR
      return 8
      // if (!this.stakemints) return 0

      // const { totalNativeToken, totalLiquidStakedToken } = this.stakemints
      // const apr = (parseFloat(totalNativeToken.quantity) - parseFloat(totalLiquidStakedToken.quantity)) / 100

      // return Math.round(apr * 100) / 100
    },

    stakeTokenBalance() {
      return this.$store.getters['wallet/balances'].find((b) => b.id == 'lsw-lsw.alcor')
    },

    stakeReceiveAmount() {
      const amount = tryParseCurrencyAmount(this.amount, new Token('wax-eosio.token', 8, 'WAX'))

      if (!amount || !this.exchangerateDown) {
        return 0
      }

      return CurrencyAmount.fromRawAmount(
        new Token('liquid.alcor', 8, 'LSW'),
        ((this.exchangerateDown * BigInt(amount.numerator.toString())) / multiplier).toString()
      ).toFixed()
    },

    receive() {
      if (!this.unstakeAmount || !this.exchangerateUp) return 0

      const liquidAmount = BigInt(
        parseFloat(this.unstakeAmount).toFixed(this.network.staking.token.decimals).replace('.', '')
      )

      const receive = (multiplier * liquidAmount) / (this.exchangerateUp + BigInt(1))

      return CurrencyAmount.fromRawAmount(new Token('wax-eosio.token', 8, 'WAX'), receive.toString()).toFixed()
    },

    tvl() {
      if (!this.stakemints) return 0
      return this.stakemints.totalNativeToken.quantity
    },

    rate() {
      if (!this.stakemints) return null

      const { totalNativeToken, totalLiquidStakedToken } = this.stakemints

      return (
        Math.round((parseFloat(totalLiquidStakedToken.quantity) / parseFloat(totalNativeToken.quantity)) * 1000) / 1000
      )
    },

    tokenA() {
      return this.network.staking.token
    },
    tokenB() {
      return this.network.baseToken
    },

    stakeSubmitDisabled() {
      return this.stakeLoading || !this.amount
    },

    renderStakeSubmitText() {
      if (!this.amount) return 'Enter Amount'
      if (this.stakeLoading) return 'Calculating'
      return 'Stake'
    },

    renderUnstakeSubmitText() {
      // if (this.unstakeMode === 'instant' && this.loading) {
      //   return 'Getting Route'
      // }
      return 'Unstake'
    },
    unstakeSubmitDisabled() {
      return this.unstakeMode === 'instant' && this.loading
    },

    isOnPending() {
      return this.$route.query.pending
    },
  },

  watch: {
    slippage() {
      this.onUnstakeAmountInput(this.unstakeAmount)
    },
    'user.name'(name) {
      this.calcOutput(this.unstakeAmount)
      if (name) this.fetchPendingUnstakes()
    },
    maxHops() {
      this.calcOutput(this.unstakeAmount)
    },
  },

  mounted() {
    this.fetchStakeMints()

    this.fetchExchangeRate(true)
    this.fetchExchangeRate(false)

    this.fetchPendingUnstakes()
  },

  methods: {
    togglePending() {
      if (this.isOnPending) {
        this.hidePending()
      } else {
        this.showPending()
      }
    },
    showPending() {
      // take this to mounted instead
      this.fetchPendingUnstakes()
      this.$router.push({
        query: {
          pending: '1',
        },
      })
    },
    hidePending() {
      this.$router.push({
        query: { pending: undefined },
      })
    },

    async fetchPendingUnstakes() {
      if (!this.user?.name) return

      const rows = await fetchAllRows(this.$rpc, {
        code: this.network.staking.contract,
        scope: this.network.staking.contract,
        table: 'withdraws',
        lower_bound: this.user.name, // user account
        upper_bound: this.user.name, // user account
        key_type: 'i64',
        index_position: 2,
        limit: 1000,
      })

      this.pendingUnstakes = rows
    },

    async fetchExchangeRate(isRoundUp) {
      const actions = [
        {
          account: 'liquid.alcor',
          name: 'exchangerate',
          authorization: [],
          data: { isRoundUp },
        },
      ]

      const { processed } = await this.$store.dispatch('chain/sendReadOnlyTransaction', actions)

      if (isRoundUp) {
        this.exchangerateUp = BigInt(processed?.action_traces[0]?.return_value_data)
      } else {
        this.exchangerateDown = BigInt(processed?.action_traces[0]?.return_value_data)
      }
    },

    onInputInAmount(value) {
      // this.stakeReceiveAmount = null
      // if (!value || isNaN(value)) return
      // this.stakeLoading = true
      // this.calcStakingAmountDebounced(value)
    },
    calcStakingAmountDebounced: debounce(function (value) {
      this.calcStakingAmount(value)
    }, 500),

    async calcStakingAmount(input) {
      console.log('input', input)

      // this is also being checked in `onInputInAmount` function but should be ok to duplicate
      if (!input || isNaN(input)) return

      try {
        const actions = [
          {
            account: 'liquid.alcor',
            name: 'getliquidamt', // use  getnativeamt  to calc WAX from LSW
            authorization: [],
            data: {
              nativeAmount: parseFloat(input).toFixed(8).replace('.', ''),
            },
          },
        ]

        console.log({ actions })

        const { processed } = await this.$store.dispatch('chain/sendReadOnlyTransaction', actions)

        const output = processed?.action_traces[0]?.return_value_data

        if (!output) return console.log('NO OUTPUT!!!')

        const o = CurrencyAmount.fromRawAmount(new Token('liquid.alcor', 8, 'LSW'), output)

        console.log(o.toFixed()) // ---> Should be output

        this.stakeReceiveAmount = o.toFixed()
      } catch (e) {
        this.$notify({ type: 'error', title: 'LSW Receive Error', message: e?.response?.data || e.message })
      } finally {
        this.stakeLoading = false
      }
    },

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

    onUnstakeAmountInput(val) {
      this.swapReceiveAmount = null
      this.loading = true
      this.calcOutputDebounced(val)
    },

    calcOutputDebounced: debounce(function (value) {
      this.calcOutput(value)
    }, 500),

    async calcOutput(value) {
      try {
        await this.tryCalcOutput(value)
      } catch (e) {
        this.swapReset()
        console.error('calcOutput', e)
        const reason = e?.response?.data ? e?.response?.data : e.message
        this.$notify({ type: 'error', title: 'Output Calculation', message: reason })
      } finally {
        this.loading = false
      }
    },

    async tryCalcOutput(value) {
      const { slippage, tokenA, tokenB } = this

      if (!value || isNaN(value) || !tokenA || !tokenB) return (this.swapReceiveAmount = null)

      if (getPrecision(value) > tokenA.decimals) {
        const [num, fraction] = value.split('.')
        value = `${num}.${fraction.slice(0, tokenA.decimals)}`
      }

      const currencyAmountIn = tryParseCurrencyAmount(value, tokenA)

      if (!currencyAmountIn) return (this.swapReceiveAmount = null)

      const {
        data: { minReceived, memo, input, output, priceImpact },
      } = await this.$axios('https://alcor.exchange/api/v2/swapRouter/getRoute', {
        params: {
          trade_type: 'EXACT_INPUT',
          input: tokenA.id,
          output: tokenB.id,
          amount: currencyAmountIn.toFixed(),
          slippage: slippage.toFixed(),
          receiver: this.user?.name,
          maxHops: this.maxHops,
          //v1: true
        },
      })

      this.memo = memo
      this.swapReceiveAmount = output
      this.priceImpact = priceImpact
      this.expectedInput = input
      // this.minReceived = minReceived
    },

    handleUnstakeClick() {
      if (this.unstakeMode === 'instant') this.swap()
      else this.unstake()
    },

    async stake() {
      const { contract } = this.network.staking
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
        this.afterTransactionHook()
        this.$notify({ type: 'success', title: 'Staking', message: 'Staking Successful' })
      } catch (e) {
        this.$notify({ type: 'error', title: 'Stake Error', message: e.message })
      }
    },

    async unstake() {
      const { contract, token } = this.network.staking

      console.log('Receive ---->', this.receive, 'Unstake Amount ---->', this.unstakeAmount)

      if (!this.unstakeAmount) return

      try {
        await this.$store.dispatch('chain/transfer', {
          to: contract,
          contract: token.contract,
          actor: this.user.name,
          quantity: parseFloat(this.unstakeAmount).toFixed(token.decimals) + ' ' + token.symbol,
          memo: 'withdraw',
        })

        this.afterTransactionHook()
        setTimeout(() => this.fetchPendingUnstakes(), 1000)
        this.$notify({ type: 'success', title: 'Delayed Unstake', message: 'Unstake Successful' })
      } catch (e) {
        this.$notify({ type: 'error', title: 'Delayed Unstake Error', message: e.message })
      }
    },

    async swap() {
      try {
        const { expectedInput, tokenA, tokenB } = this

        if (!tokenA || !tokenB) return console.log('no tokens selected')

        console.log({ expectedInput, tokenA })
        const currencyAmountIn = tryParseCurrencyAmount(parseFloat(expectedInput).toFixed(tokenA.decimals), tokenA)

        if (!currencyAmountIn) throw new Error('Invalid currency in: ', currencyAmountIn?.toAsset())

        const actions = []

        const memo = this.memo.replace('<receiver>', this.user.name)

        // TODO: add market on memo

        actions.push({
          account: tokenA.contract,
          name: 'transfer',
          authorization: [this.user.authorization],
          data: {
            from: this.user.name,
            to: this.network.amm.contract,
            quantity: currencyAmountIn.toAsset(),
            memo,
          },
        })

        const r = await this.$store.dispatch('chain/sendTransaction', actions)

        console.log('swap success', r)

        this.swapReset()
        this.afterTransactionHook()
        // add gtag event
        this.$notify({ type: 'success', title: 'Instant Unstake', message: 'Instant unstake successful' })
      } catch (e) {
        console.log(e)
        return this.$notify({ type: 'error', title: 'Instant Unstake Error', message: e.message })
      }
    },

    afterTransactionHook() {
      this.amount = null
      //this.stakeReceiveAmount = null
      this.unstakeAmount = null
      setTimeout(() => {
        this.fetchStakeMints()
      }, 1000)
      this.updateBalances()
    },

    updateBalances() {
      const { tokenA, tokenB } = this

      setTimeout(() => {
        this.$store.dispatch('updateBalance', tokenA, { root: true })
        this.$store.dispatch('updateBalance', tokenB, { root: true })
      }, 1000)
    },

    swapReset() {
      this.expectedInput = null
      this.swapReceiveAmount = null
      this.priceImpact = '0.00'
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
  .stake-title {
    display: flex;
    justify-content: space-between;
    align-items: center;
    .history-button {
      display: flex;
      align-items: center;
      gap: 4px;
    }
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
    .action-button {
      font-weight: 500;
      &.disabled {
        background: var(--btn-default) !important;
        color: #636366 !important;
        border-color: var(--btn-default) !important;
        opacity: 0.8;
        filter: none !important;
      }
    }
    .alcor-button {
      --main-action-green: var(--main-green);
      padding: 8px 20px;
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
