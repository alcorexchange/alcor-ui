<template lang="pug">
.add-friend-component
  .title.fs-18.fw-bold.d-flex.align-items-center.gap-10.mb-4
    img(src='~/assets/icons/Users.svg')
    span Add Friend
  .d-flex.flex-column.gap-16
    span.fs-14.fw-bold Friend WAX address
    el-input.dark(
      size='small',
      v-model='address',
      placeholder='Type address here',
    )
    .d-flex.justify-content-center.flex-column.gap-10(v-if="isFounded")
      profile-image.account-image(:src="imgSrc" :size="128")
      .fs-22.fw-bold.d-flex.justify-content-center {{ address }}
    alcor-button.w-100(@click="addToFriendList" access :disabled="!isFounded") Add Friend

</template>

<script>
import { mapActions } from 'vuex'
import ProfileImage from '~/components/ProfileImage.vue'
import AlcorButton from '~/components/AlcorButton'

export default {
  components: { ProfileImage, AlcorButton },
  data: () => ({ address: '', imgSrc: null, loading: false, isFounded: false }),
  watch: {
    address(v) {
      this.getAccountsData(v)
    }
  },
  methods: {
    ...mapActions('social', ['getPhotoHash', 'addFriend']),
    ...mapActions('api', ['getAccount']),

    async getAccountsData(name) {
      this.loading = true
      this.isFounded = false
      this.imgSrc = null

      const account = await this.getAccount({ accountName: name })
      if (account) {
        this.isFounded = true
        const hash = await this.getPhotoHash(name)
        if (hash) this.imgSrc = `https://gateway.pinata.cloud/ipfs/${hash}`
      }

      this.loading = false
    },
    addToFriendList() {
      this.addFriend(this.address)
        .then(() => this.$router.go(0))
    }
  }
}
</script>

<style lang="scss">
.add-friend-component {
  .dark .el-input__inner {
    background-color: var(--btn-active);
    border: 1px solid var(--btn-active);
    width: 272px;
  }
}
</style>
