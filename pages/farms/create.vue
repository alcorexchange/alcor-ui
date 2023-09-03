<template lang="pug">
.farm-create-page
  AlcorContainer(class="alcor-container")
    PageHeader(class="page-header" title="Create Farm")
      template(#end) &nbsp;
      .header-title.d-flex.gap-2
        i.el-icon-sunrise
        span Create Farm

    main
      Note(class="fs-14") You can only create a farm for a base token that you are the project owner of.

      el-select(v-model='poolId' placeholder='Select pool')
        el-option(v-for='pool in pools' :key='pool.id' :label="pool.tokenA.symbol + ' / ' + pool.tokenB.symbol + ' ' + pool.fee / 10000 + '%'" :value='pool.id')
          span(style='float: left') {{ pool.tokenA.symbol }} / {{ pool.tokenB.symbol }}
          span.ml-1 {{ pool.fee / 10000 }}%

      //TokenSelection(class="")
      //FeeTierSelection(:options="feeOptions" class=""  v-model="selectedFeeTier")

      //FeeTierSelection(:options="feeOptions" class=""  v-model="selectedFeeTier")

      RewardList(class="" @newReward="onNewReward")
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

      AlcorButton(class="submit" access @click="submit") Create Farm

</template>

<script>
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
  }),

  computed: {
    ...mapState(['network', 'user']),

    pools() {
      return this.$store.state.amm.poolsStats
    },

    rewardTokens() {
      return this.$store.state.user?.balances || []
    },

    distributionOptions() {
      const tempAmount = 1000
      return [1, 7, 30, 90, 180, 360].map((number) => ({
        value: number * 86400,
        display: `${number} Days`,
        daily: (tempAmount / number).toFixed(2),
      }))
    },
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

    async submit() {
      const actions = []

      const { rows: [lastIncentive] } = await this.$rpc.get_table_rows({
        code: this.network.amm.contract,
        scope: this.network.amm.contract,
        table: 'incentives',
        limit: 1,
        reverse: true
      })

      let lastIncentiveId = lastIncentive.id

      this.rewardList.forEach(r => {
        lastIncentiveId += 1
        console.log('r.token', r.token)
        const reward = { quantity: parseFloat(r.amount).toFixed(r.token.decimals) + ' ' + r.token.currency, contract: r.token.contract }

        actions.push({
          account: this.network.amm.contract,
          name: 'newincentive',
          authorization: [this.user.authorization],
          data: {
            creator: this.user.name,
            poolId: this.poolId,
            rewardToken: { quantity: (0).toFixed(r.token.decimals) + ' ' + r.token.currency, contract: r.token.contract },
            duration: this.selectedDistribution
          }
        })

        actions.push({
          account: reward.contract,
          name: 'transfer',
          authorization: [this.user.authorization],

          data: {
            from: this.user.name,
            to: this.network.amm.contract,
            quantity: reward.quantity,
            memo: 'incentreward#' + lastIncentiveId
          }
        })
      })

      const r = await this.$store.dispatch('chain/sendTransaction', actions)
      console.log({ r })

      this.$notify({
        type: 'info',
        title: 'Farm Creation',
        message: 'Farm created succesfully'
      })
    }
  },
}
</script>

<style lang="scss" scoped>
.farm-create-page {
  padding-top: 60px;
  .alcor-container {
    width: 100%;
    max-width: 600px;
    margin: auto;
  }
}
main {
  display: flex;
  flex-direction: column;
  gap: 32px;
  padding-top: 16px;
}
.page-header {
  flex: 1;
}
.header-title {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 24px;
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
