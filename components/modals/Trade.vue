<template lang="pug">
.trade-component
  .title.fs-18.fw-bold.d-flex.align-items-center.gap-10.mb-4
    img(src='~/assets/icons/Users.svg')
    span New Trade
  .d-flex.flex-column.gap-16
    span.fs-14.fw-bold New Trade With
    el-input.dark(
      size='small',
      v-model='address',
      placeholder='Type address here',
    )
    .d-flex.justify-content-center.flex-column.gap-10(v-if="isFounded")
      profile-image.account-image(:src="'https://wax-mainnet-ah.api.atomichub.io/v1/preview/avatar/' + address"  :size="128")
      .fs-22.fw-bold.d-flex.justify-content-center {{ address }}
    alcor-button.w-100(@click="goToTrade" access :disabled="!isFounded") Trade

</template>

<script>
import { mapActions } from 'vuex'
import ProfileImage from '~/components/ProfileImage.vue'
import AlcorButton from '~/components/AlcorButton'

export default {
  components: { ProfileImage, AlcorButton },
  data: () => ({ address: '', loading: false, isFounded: false }),
  watch: {
    address(v) {
      this.getAccountsData(v)
    }
  },
  methods: {
    ...mapActions('modal', ['closeModal']),
    ...mapActions('social', ['addFriend']),
    ...mapActions('api', ['getAccount']),

    async getAccountsData(name) {
      this.loading = true
      this.isFounded = false

      const account = await this.getAccount({ accountName: name })
      if (account) {
        this.isFounded = true
      }

      this.loading = false
    },
    goToTrade() {
      this.closeModal()
      this.$router.push({
        name: `wallet-nfts-trading-id___${this.$i18n.locale}`,
        params: { id: this.address }
      })
    }
  }
}
</script>

<style lang="scss">
.trade-component {
  .dark .el-input__inner {
    background-color: var(--btn-active);
    border: 1px solid var(--btn-active);
    width: 272px;
  }
}
</style>
