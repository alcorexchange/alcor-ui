<template lang="pug">
.main.landing
  top-nav.alcor-inner
  nuxt
  FooterBlock
</template>

<script>
import TopNav from '~/components/layout/TopNav'
import FooterBlock from '~/components/footer/Footer'

export default {
  components: {
    FooterBlock,
    TopNav
  }
}
</script>

<style lang="scss">
.landing {
  .nav {
    padding: 12px 20px !important;
  }
}
</style>
