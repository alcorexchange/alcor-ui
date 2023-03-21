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
</template>

<script>
import { mapActions } from 'vuex'
import VueSkeletonLoader from 'skeleton-loader-vue'
import MarketAuctionCard from '~/components/cards/MarketAuctionCard'

export default {
  components: { MarketAuctionCard, VueSkeletonLoader },
  data: () => ({
    auctions: null,
    debounce: null
  }),
  watch: {
    '$route.query'() {
      this.getAuctions()
    }
  },
  mounted() {
    this.getAuctions()
  },
  methods: {
    ...mapActions('api', ['getAuctionData', 'getBuyOffers']),
    async getAuctions() {
      this.auctions = await this.getAuctionData({
        ...this.$route.query
      })
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
