<template lang="pug">
.header.d-flex.justify-content-between.mt-5.mb-3
  .d-flex.gap-16.navigation
    nuxt-link(:to="localePath('positions', $i18n.locale)" :exact='true')
      .fs-20 My Positions
    nuxt-link(:to="localePath('positions-history', $i18n.locale)" :exact='true')
      .fs-20 History
  .actions.d-flex.gap-10
    AlcorButton Analytics
    AlcorButton.new(access @click="$router.push('/positions/new')")
      i.el-icon-plus
      .fs-14 New Position
</template>

<script>
import AlcorButton from '~/components/AlcorButton'

export default {
  components: { AlcorButton },
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

