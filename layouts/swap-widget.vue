<template lang="pug">
.unlim-width.default-layout
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
