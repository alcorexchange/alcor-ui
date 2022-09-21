<template lang="pug">
alcor-modal
  component(:is='current')
</template>

<script>
import { mapState } from 'vuex'

import Login from '~/components/modals/Login'
import Listing from '~/components/modals/Listing'
import BuyListing from '~/components/modals/BuyListing'
import MakeOffer from '~/components/modals/MakeOffer'
import Transfer from '~/components/modals/Transfer'
import RemoveFriend from '~/components/modals/RemoveFriend'
import AddFriend from '~/components/modals/AddFriend'
import BlockUser from '~/components/modals/BlockUser'
import AlcorModal from '~/components/AlcorModal.vue'

export default {
  components: {
    Login,
    Listing,
    BuyListing,
    MakeOffer,
    Transfer,
    RemoveFriend,
    AddFriend,
    BlockUser,
    AlcorModal
  },

  computed: {
    ...mapState('modal', ['current'])
  }
}
</script>
