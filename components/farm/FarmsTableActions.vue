<template lang="pug">
.actions-container
  .detail-table-actions.fs-12(v-if="!finished")
    template(v-if="staked")
      AlcorButton(compact @click="$emit('claim', row)") Claim Rewards
      .space
      AlcorButton(bordered danger compact @click="$emit('unstake', row)") Unstake
    template(v-else)
      AlcorButton(bordered access compact @click="$emit('stake', row)").stake-button Stake

  .detail-table-actions.fs-12(v-else)
      AlcorButton(bordered access compact @click="$emit('unstake', row)" v-if="staked").stake-button Claim & Unstake
</template>

<script>
import AlcorButton from '~/components/AlcorButton'
export default {
  name: 'FarmsTable',
  components: {
    AlcorButton,
  },

  props: ['staked', 'row', 'finished'],

  computed: {},

  methods: {},
}
</script>

<style scoped lang="scss">
.detail-table-actions {
  display: flex;
  gap: 4px;
  justify-content: flex-end;
}
.space {
  display: flex;
  width: 1px;
  border-radius: 4px;
  align-self: stretch;
  background: var(--border-color);
  margin: 0 4px;
}
.actions-container {
  display: flex;
  justify-content: flex-end;
}
.farms-actions-dropdown-container {
  padding: 0;
}
.farms-actions-dropdown-content {
  gap: 4px;
  display: flex;
  flex-direction: column;
  padding: 4px;
}
.stake-button {
  color: var(--main-action-green) !important;
  &:hover {
    background: var(--main-action-green) !important;
    color: black !important;
  }
}

.danger {
  // color: var(--main-red);
}
</style>
