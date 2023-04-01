<template lang="pug">
#nft-marketplace-auctions-page
  .d-flex.justify-content-center.justify-content-md-start.flex-wrap.gap-25
    vue-skeleton-loader(
      v-if="!auctions"
      v-for="idx in [1,2,3,4]"
      :key="idx"
      :width='220',
      :height='431',
      animation='wave',
      wave-color='rgba(150, 150, 150, 0.1)',
      :rounded='true'
    )
    MarketAuctionCard(v-if="auctions" v-for="item in auctions" :key="item.asset_id" :data="item" :ownerName="item.seller")
  infinite-loading(@infinite='getAuctions' v-if="canInfinite" :identifier="$route.query")
</template>

<script>
import { mapActions } from 'vuex'
import VueSkeletonLoader from 'skeleton-loader-vue'
import MarketAuctionCard from '~/components/cards/MarketAuctionCard'

export default {
  components: { MarketAuctionCard, VueSkeletonLoader },
  data: () => ({
    auctions: [],
    loading: false,
    page: 1,
    canInfinite: false
  }),
  watch: {
    '$route.query'() {
      this.page = 1
      this.getAuctions({
        loaded: () => { },
        complete: () => { }
      })
    }
  },
  mounted() {
    this.getAuctions({
      loaded: () => { },
      complete: () => { }
    })
  },
  methods: {
    ...mapActions('api', ['getAuctionData', 'getBuyOffers']),
    async getAuctions($state) {
      if (this.page == 1) this.loading = true
      const res = await this.getAuctionData({
        ...this.$route.query
      })
      this.auctions = this.page == 1 ? res : [...this.auctions, ...(res || [])]
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
#nft-marketplace-auctions-page {
  width: 100%;
  max-width: 970px;
  margin: 20px auto;
}
</style>
