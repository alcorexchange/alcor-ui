<template lang="pug">
#wallet-nfts-sold-page
  .d-flex.gap-32.justify-content-between(v-if='loading')
    vue-skeleton-loader(
      :width='600',
      :height='380',
      animation='wave',
      wave-color='rgba(150, 150, 150, 0.1)',
      :rounded='true'
    )
    vue-skeleton-loader(
      :width='220',
      :height='380',
      animation='wave',
      wave-color='rgba(150, 150, 150, 0.1)',
      :rounded='true'
    )
  div(v-else)
    detail-with-card-panel(
      v-for='(item, index) in solds',
      :key='index',
      :data='item',
      mode='sold'
    )
</template>

<script>
import { mapState } from 'vuex'
import VueSkeletonLoader from 'skeleton-loader-vue'
import DetailWithCardPanel from '~/components/nft_markets/DetailWithCardPanel'

export default {
  components: { VueSkeletonLoader, DetailWithCardPanel },
  data: () => ({
    solds: [],
    loading: true
  }),
  computed: {
    ...mapState(['user'])
  },
  watch: {
    '$route.query'() {
      this.getSold()
    }
  },
  mounted() {
    this.getSold()
  },
  methods: {
    async getSold() {
      this.loading = true
      this.solds = await this.$store.dispatch('api/getSales', {
        seller: this.user.name,
        state: '3',
        sort: this.$route.query?.sorting?.split('-')[0] || null,
        order: this.$route.query?.sorting?.split('-')[1] || null,
        collection_name: this.$route.query?.collection,
        match: this.$route.query?.match,
        max_template_mint: this.$route.query?.maxMint,
        min_template_mint: this.$route.query?.minMint,
        max_price: this.$route.query?.maxPrice,
        min_price: this.$route.query?.minPrice
      })
      this.loading = false
    }
  }
}
</script>

<style lang="scss" scoped>
#wallet-nfts-sold-page {
  max-width: 970px;
  margin: 0 auto;
}
</style>
