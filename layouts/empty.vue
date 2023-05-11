<template lang="pug">
.unlim-width.default-layout
  .not-footer
    AlcorLoading
    ResourcesModal
    ModalsDialog

    .alcor-inner.main
      nuxt
</template>

<script>
import ModalsDialog from '~/components/modals/ModalsDialog'
import AlcorLoading from '~/components/AlcorLoading.vue'
import ResourcesModal from '~/components/modals/Resources.vue'

export default {
  components: {
    ModalsDialog,
    AlcorLoading,
    ResourcesModal,
  },
}
</script>
