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
  infinite-loading(@infinite='getListings' v-if="canInfinite" :identifier="$route.query")
</template>

<script>
import { mapActions } from 'vuex'
import VueSkeletonLoader from 'skeleton-loader-vue'
import MarketSaleCard from '~/components/cards/MarketSaleCard'

export default {
  components: { MarketSaleCard, VueSkeletonLoader },
  data: () => ({
    listings: [],
    loading: false,
    page: 1,
    canInfinite: false
  }),
  watch: {
    '$route.query'() {
      this.page = 1
      this.getListings({
        loaded: () => { },
        complete: () => { }
      })
    }
  },
  mounted() {
    this.getListings({
      loaded: () => { },
      complete: () => { }
    })
  },
  methods: {
    ...mapActions('api', ['getSales', 'getBuyOffers']),
    async getListings($state) {
      console.log('get listings, page:', this.page)
      if (this.page == 1) this.loading = true
      const res = await this.getSales({
        ...this.$route.query
      })
      this.listings = this.page == 1 ? res : [...this.listings, ...(res || [])]
      this.page++
      this.canInfinite = true
      this.loading = false
      if (res && res.length) {
        $state.loaded()
      } else if (res && !res.length) {
        $state.complete()
      } else if (!res) {
        $state.error()
      }
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
