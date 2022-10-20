<template lang="pug">
header#account-header-component.d-flex.flex-column.gap-24
  .d-flex.justify-content-between
    .d-flex.gap-6.align-items-center
      profile-image.account-photo(:src.sync="profileImageSrc" :size="40")
      .fs-20 {{ $route.params.id }}
      copy.pointer(@click="copyUserName" width="22" height="22" :color="color")
    .d-flex.gap-6.align-items-center.pointer(@click="goBack")
      disconnect(:color="$colorMode.preference === 'dark' ? '#f2f2f2' : '#303133'" width="13" height="13")
      span Back
  .d-flex.justify-content-between.gap-30
    wallet-nft-header.w-100
    .d-flex.flex-column.align-items-end.gap-8(v-if="user")
      alcor-button(@click="removeFriendModal" big v-if="isFriend").red Remove Friend
      alcor-button(@click="addToFriendList" big access v-else) Add Friend
      alcor-button(@click="blockUserModal" danger big) Block Account
  .d-flex.gap-29.flex-wrap.w-100
    alcor-button(big @click="goToTokens" :class="{ active: $route.name.startsWith('account-id-tokens') }") {{ $t('Tokens') }}
    alcor-link(big to="/zxc") {{ $t('Transactions') }}
    alcor-button.position-relative(big @click="goToAssets()" :class="{ active: $route.name.startsWith('account-id-nfts-inventory') }")
      img.position-absolute.w-100.h-100(src="~/assets/images/nft-monkey.png", alt="nft-monkey")
      span {{ $t("NFT's") }}
    alcor-button(big @click="goToSellerPage" :class="{ active: $route.name.startsWith('account-id-nfts-listings') }") {{ $t('Seller Page') }}
    alcor-button(big @click="openTransferModal()")
      i.el-icon-takeaway-box
      span {{ $t('Transfer') }}
    alcor-button(big @click="goToTrade()")
      i.el-icon-sort.rot-90
      span {{ $t('Trade Offer') }}
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import ProfileImage from '~/components/ProfileImage.vue'
import Copy from '~/components/svg-icons/Copy.vue'
import Disconnect from '~/components/svg-icons/Disconnect.vue'
import WalletNftHeader from '~/components/wallet/WalletNFTHeader.vue'
import AlcorButton from '~/components/AlcorButton'
import AlcorLink from '~/components/AlcorLink'

export default {
  components: { ProfileImage, Copy, Disconnect, WalletNftHeader, AlcorButton, AlcorLink },
  data: () => ({
    profileImageSrc: '',
    isFriend: false
  }),
  computed: {
    ...mapGetters(['user']),
    color() {
      return this.$colorMode.preference !== 'dark' ? '#303133' : '#BDBDBD'
    }
  },
  watch: {
    user() {
      this.user && this.checkFriend()
    }
  },
  mounted() {
    this.getProfileImage()
    this.user && this.checkFriend()
  },
  methods: {
    ...mapActions('social', ['getPhotoHash', 'getFriendList', 'addFriend']),
    ...mapActions('modal', ['transfer', 'removeFriend', 'blockUser']),
    goToAssets() {
      this.$router.push({
        name: `account-id-nfts-inventory___${this.$i18n.locale}`,
        params: { id: this.$route.params.id },
        query: {
          match: '',
          collection: null,
          sorting: null,
          minMint: null,
          maxMint: null,
          minPrice: null,
          maxPrice: null,
          isDuplicates: null,
          isBacked: null
        }
      })
    },

    async getProfileImage() {
      const hash = await this.getPhotoHash(this.$route.params.id)
      this.profileImageSrc = hash && `https://gateway.pinata.cloud/ipfs/${hash}`
    },
    goBack() {
      this.$router.go(-1)
    },
    goToSellerPage() {
      this.$router.push({
        name: `account-id-nfts-listings___${this.$i18n.locale}`,
        params: { id: this.$route.params.id },
        query: {
          match: '',
          collection: null,
          sorting: null,
          minMint: null,
          maxMint: null,
          minPrice: null,
          maxPrice: null,
          isDuplicates: null,
          isBacked: null
        }
      })
    },
    goToTokens() {
      this.$router.push({
        name: `account-id-tokens___${this.$i18n.locale}`,
        params: { id: this.$route.params.id }
      })
    },
    goToTrade() {
      this.$router.push({ name: `wallet-nfts-trading-id___${this.$i18n.locale}`, params: { id: this.$route.params.id } })
    },
    addToFriendList() {
      this.addFriend(this.$route.params.id)
        .then(() => this.$router.go(0))
    },
    async checkFriend() {
      this.isFriend = (await this.getFriendList()).includes(this.$route.params.id)
    },
    blockUserModal() {
      this.blockUser({ name: this.$route.params.id, imgSrc: this.profileImageSrc })
    },
    openTransferModal() {
      this.transfer({ name: this.$route.params.id })
    },
    removeFriendModal() {
      this.removeFriend({ name: this.$route.params.id, imgSrc: this.profileImageSrc })
    },
    copyUserName() {
      navigator.clipboard.writeText(this.$route.params.id)
      this.$notify({
        title: 'Clipboard',
        message: 'Account name copyed to Clipboard',
        type: 'info'
      })
    }
  }
}
</script>

