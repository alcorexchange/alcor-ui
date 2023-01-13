<template lang="pug">
alcor-modal
  component(:is='current')
</template>

<script>
import { mapState } from 'vuex'

import Login from '~/components/modals/Login'
import Listing from '~/components/modals/Listing'
import Burn from '~/components/modals/Burn'
import Back from '~/components/modals/Back'
import Gift from '~/components/modals/Gift'
import BuyListing from '~/components/modals/BuyListing'
import MakeOffer from '~/components/modals/MakeOffer'
import MakeBid from '~/components/modals/MakeBid'
import Transfer from '~/components/modals/Transfer'
import RemoveFriend from '~/components/modals/RemoveFriend'
import AddFriend from '~/components/modals/AddFriend'
import Trade from '~/components/modals/Trade'
import BlockUser from '~/components/modals/BlockUser'
import AlcorModal from '~/components/AlcorModal.vue'

export default {
  components: {
    Login,
    Listing,
    Back,
    Burn,
    Gift,
    BuyListing,
    MakeOffer,
    MakeBid,
    Transfer,
    RemoveFriend,
    AddFriend,
    Trade,
    BlockUser,
    AlcorModal
  },

  computed: {
    ...mapState('modal', ['current'])
  }
}
</script>
