<template lang="pug">
.detail-table-actions.fs-12(v-if="!finished")
  template(v-if="staked")
    AlcorButton(compact @click="$emit('claim', row)") Claim Rewards
    .space
    AlcorButton(bordered danger compact @click="$emit('unstake', row)") Unstake
  template(v-else)
    AlcorButton(bordered compact @click="$emit('stake', row)") Stake

.detail-table-actions.fs-12(v-else)
    AlcorButton(access compact @click="$emit('unstake', row)" v-if="staked") Claim & Unstake
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
</style>
