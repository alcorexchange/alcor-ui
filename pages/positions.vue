<template lang="pug">
.d-flex.flex-column.gap-16
  //- HeightTransition
  .header-container(v-if="showHeader")
    //- because first child of HeightTransition should not have vertical padding/margin
    .header.d-flex.justify-content-between.mt-5
      .d-flex.gap-16.navigation
        nuxt-link(:to="localePath('positions', $i18n.locale)" :exact='true')
          .fs-20 My Positions
        nuxt-link(:to="localePath('positions-history', $i18n.locale)" :exact='true')
          .fs-20 History
      .actions.d-flex.gap-10
        alcor-button Analytics
        alcor-button(access @click="$router.push('/positions/new')")
          i.el-icon-plus
          .fs-14 New Position

  nuxt-child
</template>

<script>
import AlcorButton from '~/components/AlcorButton'

export default {
  components: { AlcorButton },
  fetch({ route, redirect }) {
    // No need to redirect to my-positions
    // if (route.path == '/positions') redirect('/positions/my-positions')
  },
  computed: {
    showHeader() {
      const routeName = this.$route.name
      return routeName === this.localeRoute({ name: 'positions' }).name || routeName === this.localeRoute({ name: 'positions-history' }).name
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
.header-container{
  transition: all 0.4s;
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
