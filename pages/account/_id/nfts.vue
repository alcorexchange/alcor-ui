<template lang="pug">
#account-id-nfts-layout.d-flex.flex-column.gap-16.mt-2
  alcor-tabs(:links="true" :tabs="tabs")
  main.account-nft-main
    nuxt-child

</template>

<script>
import AlcorTabs from '~/components/AlcorTabs'
export default {
  components: { AlcorTabs },
  data: () => ({
    filters: {
      match: 'asd',
      s: 'key',
      bool: false
    }
  }),
  computed: {
    tabs() {
      return [
        {
          label: 'Inventory',
          route: {
            path: '/swap',
            query: this.filters
          }
        },
        { label: 'Listings', href: '/account/' + this.$route.params.id + '/nfts/listings' }
      ]
    }
  }
}
</script>
