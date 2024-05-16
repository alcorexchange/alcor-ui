<template lang="pug">
.header.d-flex.justify-content-between.mt-5.mb-3
  .d-flex.gap-16.navigation
    nuxt-link(:to="localePath('positions', $i18n.locale)" :exact='true')
      .fs-20 {{ $t('My Positions') }}
    nuxt-link(:to="localePath('positions-history', $i18n.locale)" :exact='true')
      .fs-20 {{ $t('History') }}
  .actions.d-flex.gap-10
    AlcorButton.new(outline @click="claimAllPositions")
      i.el-icon-money
      .fs-14 Claim All

    AlcorButton.new(access @click="$router.push('/positions/new')")
      i.el-icon-plus
      .fs-14 {{ $t('New Position') }}
</template>

<script>
import AlcorButton from '~/components/AlcorButton'
import { getCollectActions } from '~/utils/amm'

export default {
  components: { AlcorButton },

  methods: {
    async claimAllPositions() {
      const positions = this.$store.getters['amm/positions']

      const actions = positions
        .filter(p => parseFloat(p.feesA) + parseFloat(p.feesB) > 0)
        .map(p => {
          return getCollectActions(
            this.$store.state.network,
            this.$store.state.user,
            p
          )
        }).flat(1)

      if (actions.length == 1) {
        this.$notify({
          type: 'info',
          title: 'Claim All',
          message: 'No positions to claim'
        })
      }

      console.log(actions)

      try {
        await this.$store.dispatch('chain/sendTransaction', actions)
      } catch (e) {
        this.$notify({
          type: 'error',
          title: 'Claim All Positions',
          message: e.message
        })
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.navigation {
  a {
    color: var(--text-disable);
  }
  a.active {
    color: var(--text-contrast);
  }
}
.new:hover{
  background: var(--main-green) !important;
  color: var(--text-theme) !important;
}
@media only screen and (max-width: 540px) {
  .header {
    flex-direction: column;
    gap: 14px;
    margin-top: 20px !important;
    .actions{
      margin-left: auto;
    }
  }
}
</style>

