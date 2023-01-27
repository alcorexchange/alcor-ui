<template lang="pug">
  .d-flex.align-items-center.gap-4.account.pointer(@click="goToProfile(accountName)")
    profile-image(:src="`https://profile.api.atomichub.io/v1/profiles/chain/wax-mainnet/account/${accountName}/avatar`" :size="24")
    .color-wax {{ accountName }}
</template>

<script>
import ProfileImage from '~/components/ProfileImage.vue'

export default {
  components: { ProfileImage },
  props: ['accountName'],
  methods: {
    goToProfile(id) {
      this.$router.push({
        name: `account-id-nfts-inventory___${this.$i18n.locale}`,
        params: { id },
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
    }
  }
}
</script>
