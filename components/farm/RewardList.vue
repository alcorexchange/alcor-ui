<template lang="pug">
.rewards-list
  .header
    .farm-create-section-title Select Reward Token
    Note.fs-14 You can only select whitelisted tokens
  .inputs
    slot

  AlcorButton(v-if="canAdd" class="add-button" @click="$emit('newReward')" bordered)
    i.el-icon-plus
    span Add Another Reward
  span.max-text.disable(v-else) Max 10 total rewards
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
  props: ['canAdd'],
}
</script>

<style scoped lang="scss">
.rewards-list {
  display: flex;
  flex-direction: column;
}
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
}
.inputs {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 8px 0;
}
.add-button::v-deep {
  padding: 8px 12x;
  border-color: var(--main-green) !important;
  color: var(--main-green);
  align-self: flex-end;

  &:hover {
    background: var(--hover) !important;
  }
}
.max-text {
  text-align: end;
}
</style>
