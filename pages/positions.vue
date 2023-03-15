<template lang="pug">
.d-flex.flex-column.gap-24
  HeightTransition
    .header(v-if="showHeader")
      //- because first child of HeightTransition should not have vertical padding/margin
      .d-flex.justify-content-between.mt-5
        .d-flex.gap-16.navigation
          nuxt-link(:to="localePath('positions', $i18n.locale)" :exact='true')
            .fs-20 My Positions
          nuxt-link(:to="localePath('positions-history', $i18n.locale)" :exact='true')
            .fs-20 History
        .d-flex.gap-10
          alcor-button Analytics
          alcor-button(access @click="$router.push('/positions/new')")
            i.el-icon-plus
            .fs-14 New Position

  nuxt-child
</template>

<script>
import AlcorButton from '~/components/AlcorButton'
import HeightTransition from '~/components/HeightTransition'

export default {
  components: { AlcorButton, HeightTransition },
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
.header{
  transition: all 0.4s;
}
</style>
