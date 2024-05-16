<template lang="pug">
#gift-links-page.py-3.py-lg-5
  gift-links(v-if="$store.state.user")
  span(v-else) not auth

</template>

<script>
import GiftLinks from '~/components/trading/GiftLinks.vue'

export default {
  components: {
    GiftLinks
  }
}
</script>
