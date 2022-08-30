<template lang="pug">
alcor-modal
  component(:is='current')
</template>

<script>
import { mapState } from 'vuex'

import Login from '~/components/modals/Login'
import BuyListing from '~/components/modals/BuyListing'
import AlcorModal from '~/components/AlcorModal.vue'

export default {
  components: {
    Login,
    BuyListing,
    AlcorModal
  },

  computed: {
    ...mapState('modal', ['current'])
  }
}
</script>
