<template lang="pug">
.layout
  ModalsDialog
  AlcorLoading

  top-nav.alcor-inner
  nuxt
  FooterBlock
</template>

<script>
import TopNav from '~/components/layout/TopNav'
import FooterBlock from '~/components/footer/Footer'

import ModalsDialog from '~/components/modals/ModalsDialog'
import AlcorLoading from '~/components/AlcorLoading.vue'

export default {
  components: {
    FooterBlock,
    TopNav,
    ModalsDialog,
    AlcorLoading
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
