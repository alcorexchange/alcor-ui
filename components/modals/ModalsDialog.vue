<template lang="pug">
alcor-modal
  component(:is='current')
</template>

<script>
import { mapState } from 'vuex'

import Login from '~/components/modals/Login'
import Assets from '~/components/modals/Assets'
import AlcorModal from '~/components/AlcorModal.vue'

export default {
  components: {
    AlcorModal,
    Login,
    Assets
  },

  computed: {
    ...mapState('modal', ['current'])
  }
}
</script>

