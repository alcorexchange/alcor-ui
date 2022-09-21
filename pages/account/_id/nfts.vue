<template lang="pug">
#account-id-nfts-layout.d-flex.flex-column.gap-16.mt-4
  account-nfts-header
  main.account-nft-main
    nuxt-child

</template>

<script>
import AccountNftsHeader from '~/components/account/AccountNftsHeader.vue'
export default {
  components: { AccountNftsHeader }
}
</script>
