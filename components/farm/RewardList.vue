<template lang="pug">
.rewards-list
  .header
    .farm-create-section-title Select Reward Token
    Note You can only select whitelisted tokens
  //- inputs
  .inputs
    slot
  AlcorButton(class="add-button" @click="$emit('newReward')" bordered)
    i.el-icon-plus
    span Add Another Reward
</template>

<script>
import AlcorButton from '@/components/AlcorButton'
import Note from '@/components/farm/Note'
export default {
  name: 'RewardsList',
  components: {
    AlcorButton,
    Note,
  },
}
</script>

<style scoped lang="scss">
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.inputs {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 8px 0;
}
.add-button::v-deep {
  padding: 10px 14px;
  border-color: var(--main-green) !important;
  color: var(--main-green);

  &:hover {
    background: var(--hover) !important;
  }
}
</style>
