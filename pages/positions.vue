<template lang="pug">
.d-flex.flex-column.gap-24.mt-5
  .d-flex.justify-content-between
    .d-flex.gap-16.navigation
      nuxt-link(:to="localePath('positions-my-positions', $i18n.locale)" :exact='true')
        .fs-20 My Positions
      nuxt-link(:to="localePath('positions-history', $i18n.locale)" :exact='true')
        .fs-20 History
    .d-flex.gap-10
      alcor-button Analytics
      alcor-button(access @click="$router.push('/new-position')")
        i.el-icon-plus
        .fs-14 New Position

  nuxt-child
</template>

<script>
import AlcorButton from '~/components/AlcorButton'

export default {
  components: { AlcorButton },
}
</script>

<style lang="scss" scoped>
.navigation {
  a { color: var(--text-disable); }
  a.active { color: var(--text-contrast); }
}
</style>
