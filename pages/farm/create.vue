<template lang="pug">
.farm-create-page
  AlcorContainer(class="alcor-container")
    PageHeader(class="page-header" title="Create Farm")
      template(#end) &nbsp;
      .header-title.d-flex.gap-2
        i.el-icon-sunrise
        span Create Farm

    main
      div.pool-select-container
        Note(class="fs-14") You can only create a farm for a pool that you are owner of one of token.
        el-select.pool-select(v-model='poolId' placeholder='Select pool' filterable)
          el-option(v-for='pool in pools' :key='pool.id' :label="pool.tokenA.symbol + ' / ' + pool.tokenB.symbol + ' ' + pool.fee / 10000 + '%'" :value='pool.id')
            span(style='float: left') {{ pool.tokenA.symbol }} / {{ pool.tokenB.symbol }}
            span.ml-1 {{ pool.fee / 10000 }}%

      //TokenSelection(class="")
      //FeeTierSelection(:options="feeOptions" class=""  v-model="selectedFeeTier")
      //FeeTierSelection(:options="feeOptions" class=""  v-model="selectedFeeTier")

      RewardList(class="")
        FarmTokenInput(
          v-for="reward, index in rewardList"
          label="Amount"
          :canRemove="index > 0"
          @remove="() => onRemoveReward(index)"
          @tokenSelected="onRewardTokenSelect($event, index)"
          :tokens="rewardTokens"
          :token="reward.token"
          v-model="reward.amount"
        )

      DistributionSelection(:options="distributionOptions" class=""  v-model="selectedDistribution")

      AlcorButton(class="submit" access @click="create") Create Farm

</template>

<script>
// TODO Sort and add tokens logos
import { mapState } from 'vuex'
import AlcorContainer from '@/components/AlcorContainer'
import PageHeader from '@/components/amm/PageHeader'
import Note from '@/components/farm/Note'
import TokenSelection from '@/components/farm/TokenSelection'
import FeeTierSelection from '@/components/farm/FeeTierSelection'
import DistributionSelection from '@/components/farm/DistributionSelection'
import RewardList from '@/components/farm/RewardList'
import FarmTokenInput from '@/components/farm/FarmTokenInput'
import AlcorButton from '@/components/AlcorButton'
export default {
  name: 'CreateFarm',
  components: {
    AlcorContainer,
    PageHeader,
    Note,
    TokenSelection,
    FeeTierSelection,
    RewardList,
    FarmTokenInput,
    DistributionSelection,
    AlcorButton,
  },

  data: () => ({
    poolId: null,
    feeOptions: [{ value: 0.05 }, { value: 0.3 }, { value: 1 }],
    rewardList: [{ token: undefined, amount: 0 }],

    selectedFeeTier: 1,
    selectedDistribution: 86400,
    rewardTokensWhitelist: [],
  }),

  computed: {
    ...mapState(['network', 'user']),

    pools() {
      const pools = [...this.$store.state.amm.poolsStats]
      return (
        pools
          // sort by pool fee
          .sort((poolA, poolB) => {
            if (poolA.fee < poolB.fee) return -1
            if (poolA.fee > poolB.fee) return 1
            return 0
          })
          // sort by token symbols
          .sort((poolA, poolB) => {
            const poolATokens = poolA.tokenA.symbol + poolA.tokenB.symbol
            const poolBTokens = poolB.tokenA.symbol + poolB.tokenB.symbol
            if (poolATokens < poolBTokens) return -1
            if (poolATokens > poolBTokens) return 1
            return 0
          })
      )
    },

    rewardTokens() {
      const balances = this.$store.getters['wallet/balances']

      return balances.filter((b) => {
        return this.rewardTokensWhitelist.some(
          (e) =>
            e.token.contract == b.contract &&
            e.token.quantity.split(' ')[1] == b.currency
        )
      })
    },

    distributionOptions() {
      const amount = this.rewardList[0].amount || 0
      const token = this.rewardList[0].token
      return [1, 7, 30, 90, 180, 360].map((number) => ({
        value: number * 86400,
        display: `${number} Days`,
        daily: token
          ? `${(amount / number).toFixed(2)} ${token.currency}`
          : '-',
      }))
    },
  },

  async mounted() {
    const { rows } = await this.$rpc.get_table_rows({
      code: this.network.amm.contract,
      scope: this.network.amm.contract,
      table: 'whitelist',
      limit: 1000,
    })

    this.rewardTokensWhitelist = rows
  },

  methods: {
    onRewardTokenSelect(token, index) {
      this.rewardList[index].token = token
    },

    onNewReward() {
      this.rewardList = [
        ...this.rewardList,
        {
          token: undefined,
          amount: 0,
        },
      ]
    },

    onRemoveReward(index) {
      this.rewardList = this.rewardList.filter((_, i) => i !== index)
    },

    async create() {
      try {
        await this.submit()
        setTimeout(
          () => this.$store.dispatch('farms/updateStakesAfterAction'),
          500
        )

        this.$notify({
          type: 'info',
          title: 'Farm Creation',
          message: 'Farm created succesfully',
        })

        this.$router.push('/farm')
      } catch (e) {
        this.$notify({
          type: 'error',
          title: 'Create Farm',
          message: e.message,
        })
      }
    },

    async submit() {
      const actions = []

      const {
        rows: [lastIncentive],
      } = await this.$rpc.get_table_rows({
        code: this.network.amm.contract,
        scope: this.network.amm.contract,
        table: 'incentives',
        limit: 1,
        reverse: true,
      })

      let lastIncentiveId = lastIncentive?.id ?? -1 // In case no incentives yet

      this.rewardList.forEach((r) => {
        lastIncentiveId += 1
        console.log('r.token', r.token)
        const reward = {
          quantity:
            parseFloat(r.amount).toFixed(r.token.decimals) +
            ' ' +
            r.token.currency,
          contract: r.token.contract,
        }

        actions.push({
          account: this.network.amm.contract,
          name: 'newincentive',
          authorization: [this.user.authorization],
          data: {
            creator: this.user.name,
            poolId: this.poolId,
            rewardToken: {
              quantity: (0).toFixed(r.token.decimals) + ' ' + r.token.currency,
              contract: r.token.contract,
            },
            duration: this.selectedDistribution,
          },
        })

        actions.push({
          account: reward.contract,
          name: 'transfer',
          authorization: [this.user.authorization],

          data: {
            from: this.user.name,
            to: this.network.amm.contract,
            quantity: reward.quantity,
            memo: 'incentreward#' + lastIncentiveId,
          },
        })
      })

      const r = await this.$store.dispatch('chain/sendTransaction', actions)
      console.log({ r })
    },
  },
}
</script>

<style lang="scss" scoped>
.farm-create-page {
  padding-top: 60px;
  .alcor-container {
    width: 100%;
    max-width: 450px;
    margin: auto;
  }
}
.pool-select-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.pool-select::v-deep {
  width: 100%;
  .el-input__inner {
    padding-left: 14px;
  }
}
main {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding-top: 16px;
}
.page-header {
  flex: 1;
}
.header-title {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 18px;
  font-weight: bold;
}

.submit {
  padding: 10px 14px;
}
</style>

<style lang="scss">
.farm-create-section-title {
  font-size: 18px;
  color: var(--disabled-indicator);
}

@media only screen and (max-width: 480px) {
  .farm-create-section-title {
    font-size: 16px;
  }
}
</style>
