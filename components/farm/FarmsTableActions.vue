<template lang="pug">
.detail-table-actions.fs-12
  AlcorButton(compact @click="emit('claim')") Claim Rewards
  AlcorButton(compact @click="$emit('manage')") Manage LP Positions
  .space
  AlcorButton(bordered danger compact @click="$emit('unstake')") Unstake
</template>

<script>
import AlcorButton from '~/components/AlcorButton'
export default {
  name: 'FarmsTable',
  components: {
    AlcorButton,
  },

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
</style>
