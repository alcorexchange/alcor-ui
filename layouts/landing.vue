<template lang="pug">
.layout
  MigrationBanner
  ModalsDialog
  AlcorLoading
  SignerOfferModal
  MigrationPromptModal

  top-nav.alcor-inner
  nuxt
  FooterBlock
</template>

<script>
import TopNav from '~/components/layout/TopNav'
import FooterBlock from '~/components/footer/Footer'
import MigrationBanner from '~/components/layout/MigrationBanner'

import ModalsDialog from '~/components/modals/ModalsDialog'
import AlcorLoading from '~/components/AlcorLoading.vue'
import SignerOfferModal from '~/components/modals/SignerOfferModal.vue'
import MigrationPromptModal from '~/components/modals/MigrationPromptModal.vue'

export default {
  components: {
    FooterBlock,
    TopNav,
    ModalsDialog,
    AlcorLoading,
    MigrationBanner,
    SignerOfferModal,
    MigrationPromptModal,
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
