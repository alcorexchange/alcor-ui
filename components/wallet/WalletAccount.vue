<template lang="pug">
.wallet-account-component.d-flex.justify-content-between(v-if="user")
  .d-flex.gap-6.align-items-center
    profile-image(editable :src.sync="profileImageSrc", :hash.sync="profileImageHash")
    wallet-name
    wallet-actions
  .d-flex.gap-6
    span Disconnect

</template>

<script>
import { mapActions, mapGetters } from 'vuex'
import ProfileImage from '~/components/ProfileImage.vue'
import WalletName from '~/components/wallet/WalletName.vue'
import WalletActions from '~/components/wallet/WalletActions.vue'

export default {
  components: { ProfileImage, WalletName, WalletActions },
  data: () => ({
    profileImageSrc: '',
    profileImageHash: ''
  }),
  computed: {
    ...mapGetters(['user'])
  },
  watch: {
    user(user) {
      user && !this.profileImageSrc && this.setProfileImage()
    },
    profileImageHash(photo_hash) {
      this.updatePhoto({ photo_hash }).then(this.setProfileImage)
    }
  },
  mounted() {
    this.setProfileImage()
  },
  methods: {
    ...mapActions('social', ['updatePhoto', 'getPhotoHash']),
    async setProfileImage() {
      const hash = this.user && await this.getPhotoHash()
      this.profileImageSrc = hash && `https://gateway.pinata.cloud/ipfs/${hash}`
    }
  }
}
</script>
