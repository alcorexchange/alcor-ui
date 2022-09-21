<template lang="pug">
header#account-nfts-header-component.d-flex.gap-24
  .d-flex.gap-24
    alcor-tab-link(v-for="{ label, href } in tabs" :to="href") {{ label }}
</template>

<script>
import AlcorTabLink from '~/components/AlcorTabLink.vue'

export default {
  components: { AlcorTabLink },
  computed: {
    tabs() {
      return [
        { label: 'Inventory', href: '/account/' + this.$route.params.id + '/nfts/inventory' },
        { label: 'Listings', href: '/account/' + this.$route.params.id + '/nfts/listings' }
      ]
    }
  }
}
</script>
