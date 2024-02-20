<template lang="pug">
.wallet-account-component.d-flex.justify-content-between(v-if="user")
  .d-flex.gap-6.align-items-center
    profile-image.account-photo(editable
      :src="`https://profile.api.atomichub.io/v1/profiles/chain/wax-mainnet/account/${$store.state.user.name}/avatar`"
      :hash.sync="profileImageHash"
      :size="40"
    )
    wallet-name
    wallet-actions
  .d-flex.gap-6.align-items-center.pointer(@click="logout" v-if="user")
    disconnect(:color="$colorMode.preference === 'dark' ? '#f2f2f2' : '#303133'" width="13" height="13")
    span Disconnect

</template>

<script>
import { mapActions, mapGetters } from 'vuex'
import ProfileImage from '~/components/ProfileImage.vue'
import WalletName from '~/components/wallet/WalletName.vue'
import WalletActions from '~/components/wallet/WalletActions.vue'
import Disconnect from '~/components/svg-icons/Disconnect.vue'

export default {
  components: { ProfileImage, WalletName, WalletActions, Disconnect },
  data: () => ({
    profileImageHash: ''
  }),
  computed: {
    ...mapGetters(['user'])
  },
  watch: {
    profileImageHash(photo_hash) {
      this.updatePhoto({ photo_hash })
    }
  },
  methods: {
    ...mapActions('social', ['updatePhoto']),
    async logout() {
      await this.$store.dispatch('chain/logout')
    },
  }
}
</script>

<style lang="scss">
.account-photo {
  width: 40px;
  height: 40px;
}
</style>
