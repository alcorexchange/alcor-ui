<template lang="pug">
AlcorButton.new(outline @click="claimAllPositions")
  i.el-icon-money
  .fs-14 Claim All
</template>

<script>
import AlcorButton from '~/components/AlcorButton'
import { getCollectActions } from '~/utils/amm'

export default {
  name: 'PositionsClaimAllButton',
  components: { AlcorButton },

  methods: {
    async claimAllPositions() {
      const positions = this.$store.getters['amm/positions']

      const actions = positions
        .filter((p) => parseFloat(p.feesA) + parseFloat(p.feesB) > 0)
        .map((p) => {
          return getCollectActions(this.$store.state.network, this.$store.state.user, p)
        })
        .flat(1)

      if (actions.length == 1) {
        this.$notify({
          type: 'info',
          title: 'Claim All',
          message: 'No positions to claim',
        })
      }

      console.log(actions)

      try {
        await this.$store.dispatch('chain/sendTransaction', actions)
      } catch (e) {
        this.$notify({
          type: 'error',
          title: 'Claim All Positions',
          message: e.message,
        })
      }
    },
  },
}
</script>

<style scoped lang="scss">
.new:hover {
  background: var(--main-green) !important;
  color: var(--text-theme) !important;
}
</style>
