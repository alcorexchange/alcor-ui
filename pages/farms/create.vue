<template lang="pug">
.farm-create-page
  AlcorContainer(class="alcor-container")
    PageHeader(class="page-header" title="Create Farm")
      template(#end) &nbsp;

    Note(class="mt-2 fs-14") You can only create a farm for a base token that you are the project owner of.

    TokenSelection(class="mt-3")

    FeeTierSelection(:options="feeOptions" class="mt-3"  :value="1")

    RewardList(class="mt-3" @newReward="onNewReward")
      FarmTokenInput(v-for="reward, index in rewardList" :canRemove="index > 0" @remove="onRemoveReward(index)")

</template>

<script>
import AlcorContainer from '@/components/AlcorContainer'
import PageHeader from '@/components/amm/PageHeader'
import Note from '@/components/farm/Note'
import TokenSelection from '@/components/farm/TokenSelection'
import FeeTierSelection from '@/components/farm/FeeTierSelection'
import RewardList from '@/components/farm/RewardList'
import FarmTokenInput from '@/components/farm/FarmTokenInput'
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
  },

  data: () => ({
    feeOptions: [{ value: 0.05 }, { value: 0.3 }, { value: 1 }],
    rewardList: [{ token: '', amount: 0 }],
  }),

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
  }
}
.page-header {
  flex: 1;
}
</style>

<style lang="scss">
.farm-create-section-title {
  font-size: 18px;
}
</style>
