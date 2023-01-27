<template lang="pug">
card
  profile-image(
    :src="`https://profile.api.atomichub.io/v1/profiles/chain/wax-mainnet/account/${data.name}/avatar`"
    :size="128")
  .account-name.py-3 {{ data.name }}
  .d-flex.justify-content-between.px-4
    span.d-flex.align-items-center.gap-4
      img.icon(:src="require('~/assets/icons/wax.svg')")
      p.disable Value
    span.d-flex.align-items-center.gap-4
      img.icon(:src="require('~/assets/icons/club.svg')")
      p.disable Owned NFTs
  .d-flex.justify-content-between.px-4.mt-1
    vue-skeleton-loader(
      v-if="data.suggested_average <= 0"
      :width='75',
      :height='17',
      animation='wave',
      wave-color='rgba(150, 150, 150, 0.1)',
      :rounded='true',
    )
    .color-wax.fs-14(v-else) {{ data.suggested_average ? data.suggested_average.toFixed(2) : 0 }} {{ this.$store.state.network.name.toUpperCase() }}
    vue-skeleton-loader(
      v-if="!data.assetsCount"
      :width='25',
      :height='17',
      animation='wave',
      wave-color='rgba(150, 150, 150, 0.1)',
      :rounded='true',
    )
    .fs-14(v-else) {{ data.assetsCount }}
  .d-flex.justify-content-between.px-4
    vue-skeleton-loader(
      v-if="data.suggested_average <= 0"
      :width='75',
      :height='17',
      animation='wave',
      wave-color='rgba(150, 150, 150, 0.1)',
      :rounded='true',
    )
    .color-green.fs-12(v-else) (${{ data.suggested_average ? $systemToUSD(data.suggested_average) : '0.00' }})

  template(#footer)
    .d-flex.justify-content-between.px-3.py-2.gap-8
      alcor-button.w-50(@click="goToProfile" outline) Profile
      el-dropdown.w-50(trigger='click')
        alcor-button.w-100(access)
          span More
          i.el-icon-arrow-down
        el-dropdown-menu.dropdown
          el-dropdown-item.dropdown__item
            .dropdown__inner(@click="goToTrade()")
              i.el-icon-sort.rot-90
              span Send Trade Offer
          el-dropdown-item.dropdown__item
            .dropdown__inner(@click="openTransferModal")
              i.el-icon-takeaway-box
              span Transfer
          el-dropdown-item.dropdown__item
            .dropdown__inner(@click="goToSellerPage()")
              i.el-icon-s-shop
              span Seller Page
          el-dropdown-item.dropdown__item
            .dropdown__inner(v-if="isFriend" @click="removeFriendModal")
              i.el-icon-remove-outline
              span Remove Friend
            .dropdown__inner(v-else @click="addToFriendList")
              i.el-icon-circle-plus-outline
              span Add Friend
          el-dropdown-item.dropdown__item
            .dropdown__inner(@click="blockUserModal")
              img(src='~/assets/icons/SmileyXEyes.svg')
              span.red Block
</template>

<script>
import { mapActions, mapGetters } from 'vuex'
import VueSkeletonLoader from 'skeleton-loader-vue'
import AlcorButton from '~/components/AlcorButton'
import Card from '~/components/cards/Card.vue'
import ProfileImage from '~/components/ProfileImage.vue'

export default {
  components: { Card, ProfileImage, VueSkeletonLoader, AlcorButton },
  props: ['data', 'isFriend'],
  computed: {
    ...mapGetters(['user'])
  },
  methods: {
    ...mapActions('modal', ['transfer', 'removeFriend', 'blockUser']),
    ...mapActions('social', ['getFriendList', 'addFriend']),
    goToTrade() {
      this.$router.push({
        name: `wallet-nfts-trading-id___${this.$i18n.locale}`,
        params: { id: this.data.name }
      })
    },
    goToSellerPage() {
      this.$router.push({
        name: `account-id-nfts-listings___${this.$i18n.locale}`,
        params: { id: this.data.name },
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
    openTransferModal() {
      this.transfer({ ...this.data, reciever: this.data.name })
    },
    addToFriendList() {
      this.addFriend(this.data).then(() => this.$router.go(0))
    },
    removeFriendModal() {
      this.removeFriend(this.data)
    },
    blockUserModal() {
      this.blockUser(this.data)
    },
    goToProfile() {
      this.$router.push({
        name: `account-id-tokens___${this.$i18n.locale}`,
        params: { id: this.data.name }
      })
    }
  }
}
</script>

<style lang="scss">
.account-name {
  font-size: 24px;
  line-height: 20px;
  text-align: center;
}

.icon {
  width: 14px;
  height: 14px;
}
</style>
