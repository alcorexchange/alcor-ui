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
    getAuctions() {
      clearTimeout(this.debounce)
      // TODO: GET FROM QUERY
      this.debounce = setTimeout(async () => {
        this.auctions = null
        this.auctions = await this.getAuctionData({
          sort: this.$route.query?.sorting?.split('-')[0] || null,
          order: this.$route.query?.sorting?.split('-')[1] || null,
          collection_name: this.$route.query?.collection,
          search: this.$route.query?.match,
          max_template_mint: this.$route.query?.maxMint,
          min_template_mint: this.$route.query?.minMint,
          max_price: this.$route.query?.maxPrice,
          min_price: this.$route.query?.minPrice
        })
      }, 600)
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
