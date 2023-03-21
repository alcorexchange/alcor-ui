<template lang="pug">
#nfts-marketplace-sales-page
  .d-flex.justify-content-center.justify-content-md-start.flex-wrap.gap-25(v-if="loading")
    vue-skeleton-loader(
      v-if="!listings"
      v-for="idx in [1,2,3,4]"
      :key="idx"
      :width='220',
      :height='400',
      animation='wave',
      wave-color='rgba(150, 150, 150, 0.1)',
      :rounded='true'
    )
  .d-flex.justify-content-center.justify-content-md-start.flex-wrap.gap-25(v-else)
    MarketSaleCard(v-if="listings" v-for="item in listings" :key="item.asset_id" :data="item" :ownerName="item.seller")
</template>

<script>
import { mapActions } from 'vuex'
import VueSkeletonLoader from 'skeleton-loader-vue'
import MarketSaleCard from '~/components/cards/MarketSaleCard'

export default {
  components: { MarketSaleCard, VueSkeletonLoader },
  data: () => ({
    listings: null,
    loading: false
  }),
  watch: {
    '$route.query'() {
      this.getListings()
    }
  },
  mounted() {
    this.getListings()
  },
  methods: {
    ...mapActions('api', ['getSales', 'getBuyOffers']),
    async getListings() {
      this.loading = true
      this.listings = await this.getSales({
        ...this.$route.query
      })
      this.loading = false
    }
  }
}
</script>

<style lang="scss" scoped>
#nfts-marketplace-sales-page {
  width: 100%;
  max-width: 970px;
  margin: 20px auto;
}
</style>
