<template lang="pug">
.unlim-width.default-layout.swap-widget-container
  .not-footer
    AlcorLoading
    ResourcesModal
    ModalsDialog

    .alcor-inner.main
      TopNav.mb-2
      nuxt
</template>

<script>
import TopNav from '~/components/layout/TopNav'
import ModalsDialog from '~/components/modals/ModalsDialog'
import AlcorLoading from '~/components/AlcorLoading.vue'
import ResourcesModal from '~/components/modals/Resources.vue'
import ConnectNav from '~/components/layout/ConnectNav.vue'

export default {
  components: {
    ModalsDialog,
    AlcorLoading,
    ResourcesModal,
    ConnectNav,
    TopNav
  },
}
</script>

<style>
.swap-widget-container {
  max-width: 450px;
  width: 100%;
}
</style>

