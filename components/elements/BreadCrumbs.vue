<template lang="pug">
#bead-crumb-component.d-flex.gap-8
  locale-link.color-default.d-flex.gap-8.fs-12(
    v-if="crumbs"
    v-for="({label, to, name}, idx) in crumbs"
    :to="to"
    :class="{ disable: $route.name === name }"
    :key="name"
  )
    span(v-if="idx") >
    span {{ label }}

</template>

<script>
import LocaleLink from '~/components/elements/LocaleLink'

export default {
  components: { LocaleLink },
  computed: {
    crumbs() {
      return this.$route.path
        .split('/')
        .filter((crumb) => crumb.length && crumb !== this.$i18n.locale)
        .reduce(
          (crumbs, crumb, i) => [...crumbs, [crumbs[i - 1], crumb].join('/')],
          []
        )
        .map((crumb) => ({
          to: crumb,
          name:
            crumb
              .split('/')
              .join('-')
              .slice(1) + `___${this.$i18n.locale}`,
          label: crumb
            .split('/')
            .pop()
            .split('-')
            .map((w) => w[0].toUpperCase() + w.slice(1))
            .join(' ')
        }))
    }
  }
}
</script>

<style lang="scss">
// reset
#bead-crumb-component a {
  color: var(--text-default);
  &:hover {
    color: var(--text-default) !important;
  }
  &.disable:hover {
    color: var(--text-disable) !important;
    cursor: auto;
  }
}
</style>
