<template lang="pug">
.farm-create-page
  AlcorContainer(class="alcor-container")
    PageHeader(class="page-header" title="Create Farm")
      template(#end) &nbsp;

    Note(class="sfs-14") You can only create a farm for a base token that you are the project owner of.

    TokenSelection(class="")

    FeeTierSelection(:options="feeOptions" class=""  v-model="selectedFeeTier")

    RewardList(class="" @newReward="onNewReward")
      FarmTokenInput(v-for="reward, index in rewardList" :canRemove="index > 0" @remove="onRemoveReward(index)" label="Amount")

    DistributionSelection(:options="distributionOptions" class=""  value="1 Days")

    AlcorButton(class="submit" access) Create Farm

</template>

<script>
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
    feeOptions: [{ value: 0.05 }, { value: 0.3 }, { value: 1 }],
    rewardList: [{ token: '', amount: 0 }],

    selectedFeeTier: 1,
  }),

  computed: {
    distributionOptions() {
      const tempAmount = 1000
      return [1, 7, 30, 90, 180, 360].map((number) => ({
        value: `${number} Days`,
        daily: (tempAmount / number).toFixed(2),
      }))
    },
  },

  methods: {
    onNewReward() {
      this.rewardList.push({
        token: '',
        amount: 0,
      })
    },
    onRemoveReward(index) {
      this.rewardList = this.rewardList.filter((_, i) => i !== index)
    },
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
    display: flex;
    flex-direction: column;
    gap: 18px;
  }
}
.page-header {
  flex: 1;
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
</style>
