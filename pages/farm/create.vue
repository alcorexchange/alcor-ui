<template lang="pug">
.farm-create-page
  AlcorContainer.p-3(class="alcor-container")
    PageHeader(class="page-header" title="Create Farm")
      template(#end) &nbsp;
      .header-title.d-flex.gap-2
        i.el-icon-sunrise
        span Create Farm

    main
      div.pool-select-container
        Note(class="fs-14") You need to be the issuer of one of the tokens.
        //- el-select.pool-select(v-model='poolId' placeholder='Select pool' filterable)
        //-   el-option(v-for='pool in pools' :key='pool.id' :label="pool.tokenA.symbol + ' ' + pool.tokenA.contract + ' / ' + pool.tokenB.symbol + ' ' + pool.tokenB.contract + ' ' + pool.fee / 10000 + '%'" :value='pool.id')
        //-     span(style='float: left') {{ pool.tokenA.symbol }} {{ pool.tokenA.contract }} / {{ pool.tokenB.symbol }} {{ pool.tokenB.contract }}
        //-     span.ml-1 {{ pool.fee / 10000 }}%

        //TokenSelection(class="")

        .token-selection.mt-1
          .item
            .farm-create-section-title Select Base Token

            SelectToken(
              :token='tokenA',
              :tokens='tokens',
              @selected='selectA'
              w100
            )

          .item
            .farm-create-section-title Select Quote Token
            SelectToken(
              :token='tokenB',
              :tokens='tokens',
              @selected='selectB'
              w100
            )

      template(v-if="feeOptions.length > 0")
        FeeTierSelection(:options="feeOptions" class="" v-model="selectedFeeTier").mt-2

        RewardList(@newReward="onNewReward" :canAdd="canAddRewards")
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

        ElAlert(
          title="Max Reward Count Reached"
          description="You can not create farms with more than 10 active incentives, Please remove some rewards."
          type="error"
          :closable="false"
          v-if="rewardCountExceeded"
        )

        DistributionSelection(:options="distributionOptions" class=""  v-model="selectedDistribution")

        el-tag(v-if="feeToken" size="big" @click="buyFeeToken").pointer
          | Farm creation fee
          | {{ feeToken.quantity }}
          //img(:src="$tokenLogo(feeToken.symbol, feeToken.contract)" height="12").ml-1

        AlcorButton(class="submit" access @click="create" :class="{disabled: submitDisabled}" :disabled="submitDisabled") {{ renderSubmitText }}
      template(v-else)
        .no-pool.disable
          i.el-icon-moon-night.fs-24
          span.fs-14 No Pool Found

</template>

<script>
// TODO Sort and add tokens logos
import { mapState, mapGetters } from 'vuex'
import AlcorContainer from '@/components/AlcorContainer'
import PageHeader from '@/components/amm/PageHeader'
import Note from '@/components/farm/Note'
import FeeTierSelection from '@/components/farm/FeeTierSelection'
import DistributionSelection from '@/components/farm/DistributionSelection'
import RewardList from '@/components/farm/RewardList'
import FarmTokenInput from '@/components/farm/FarmTokenInput'
import AlcorButton from '@/components/AlcorButton'
import SelectToken from '@/components/modals/amm/SelectToken2'
import { parseToken } from '~/utils/amm'

export default {
  name: 'CreateFarm',
  components: {
    SelectToken,
    AlcorContainer,
    PageHeader,
    Note,
    FeeTierSelection,
    RewardList,
    FarmTokenInput,
    DistributionSelection,
    AlcorButton,
  },

  data: () => ({
    tokenA: null,
    tokenB: null,

    rewardList: [{ token: undefined, amount: 0 }],

    selectedFeeTier: null,
    selectedDistribution: 86400,
    rewardTokensWhitelist: [],
  }),

  computed: {
    ...mapState(['network', 'user']),
    ...mapGetters('farms', ['farmPools']),
    ...mapGetters('amm/liquidity', ['tokens']),

    activeIncentivesLength() {
      const poolId = this.poolId
      if (poolId === null) return 0

      const farmPool = this.farmPools.find((farm) => farm.id === poolId)

      const activeIncentives = farmPool?.incentives.filter((i) => !i.isFinished)

      return activeIncentives?.length || 0
    },

    allowedRewardCount() {
      return 10 - this.activeIncentivesLength
    },

    canAddRewards() {
      // is used to remove the add button
      return this.rewardList.length < this.allowedRewardCount
    },

    rewardCountExceeded() {
      // is used show warning and not allow submitting
      return this.rewardList.length > this.allowedRewardCount
    },

    feeOptions() {
      const pools = this.$store.state.amm.pools.filter((p) => {
        return (
          (parseToken(p.tokenA).id == this.tokenA?.id && parseToken(p.tokenB).id == this.tokenB?.id) ||
          (parseToken(p.tokenA).id == this.tokenB?.id && parseToken(p.tokenB).id == this.tokenA?.id)
        )
      })

      return pools
        .map((p) => {
          return { value: p.fee / 10000 }
        })
        .sort((a, b) => a.value - b.value)
    },

    poolId() {
      if (!this.selectedFeeTier) return null

      const pool = this.$store.state.amm.pools.find((p) => {
        return (
          ((parseToken(p.tokenA).id == this.tokenA?.id && parseToken(p.tokenB).id == this.tokenB?.id) ||
            (parseToken(p.tokenA).id == this.tokenB?.id && parseToken(p.tokenB).id == this.tokenA?.id)) &&
          p.fee == this.selectedFeeTier * 10000
        )
      })

      return pool.id
    },

    feeToken() {
      if (this.user?.name == 'liquid.mars') return null

      const feeToken = this.$getToken(this.network?.farmCreationFee?.token)

      if (!feeToken) return null

      return {
        ...feeToken,
        quantity: this.network.farmCreationFee.amount.toFixed(feeToken.decimals) + ' ' + feeToken.symbol,
      }
    },

    rewardTokens() {
      return this.$store.getters['wallet/balances']
    },

    distributionOptions() {
      const amount = this.rewardList[0].amount || 0
      const token = this.rewardList[0].token
      return [1, 7, 30, 60, 90, 180, 240, 360].map((number) => ({
        value: number * 86400,
        display: `${number} Days`,
        daily: token ? `${(amount / number).toFixed(2)} ${token.currency}` : '-',
      }))
    },

    renderSubmitText() {
      if (this.rewardCountExceeded) return 'Decrease Reward Count'
      if (!this.selectedFeeTier) return 'Select Fee Tier'
      return 'Create Farm'
    },

    submitDisabled() {
      return this.rewardCountExceeded || !this.selectedFeeTier
    },
  },

  watch: {
    // feeOptions() {
    //   if (!this.selectedFeeTier) {
    //     if (this.feeOptions.find(f => f.value == 0.3)) {
    //       this.selectedFeeTier = 0.3
    //     } else {
    //       this.selectedFeeTier = this.feeOptions[this.feeOptions.length - 1]
    //     }
    //   }
    // }
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
    selectA(token) {
      this.tokenA = token
    },

    selectB(token) {
      this.tokenB = token
    },

    buyFeeToken() {
      this.$router.push(
        this.localeRoute({
          path: '/swap',
          query: {
            output: this.feeToken.id,
          },
        })
      )
    },

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
      if (!this.selectedFeeTier) {
        return this.$notify({
          type: 'warning',
          title: 'Create Farm',
          message: 'Select pool fee tier!',
        })
      }

      try {
        await this.submit()
        setTimeout(() => this.$store.dispatch('farms/updateStakesAfterAction'), 500)

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
          quantity: parseFloat(r.amount).toFixed(r.token.decimals) + ' ' + r.token.currency,
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

      if (this.feeToken) {
        actions.push({
          account: this.feeToken.contract,
          name: 'transfer',
          authorization: [this.user.authorization],

          data: {
            from: this.user.name,
            to: this.network.feeAccount,
            quantity: this.feeToken.quantity,
            memo: 'farm creation',
          },
        })
      }

      console.log({ actions })
      const r = await this.$store.dispatch('chain/sendTransaction', actions)
      setTimeout(() => this.$store.dispatch('farms/updateStakesAfterAction'), 500)
      console.log({ r })
    },
  },
}
</script>

<style lang="scss" scoped>
.token-selection {
  display: flex;
  gap: 10px;
  .item {
    flex: 1;
  }
}
.farm-create-page {
  padding-top: 60px;
  .alcor-container {
    width: 100%;
    max-width: 480px;
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

.no-pool {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
  padding-top: 8px;
}

.submit {
  padding: 10px 14px;
  &.disabled {
    background: var(--btn-default) !important;
    color: #636366 !important;
    border-color: var(--btn-default) !important;
    opacity: 0.8;
    filter: none !important;
  }
}
</style>

<style lang="scss">
.farm-create-section-title {
  font-size: 14px;
  color: var(--disabled-indicator);
}

@media only screen and (max-width: 480px) {
  .farm-create-section-title {
    font-size: 16px;
  }
}
</style>
