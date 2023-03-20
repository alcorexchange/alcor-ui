<template lang="pug">
#nfts-marketplace-sales-page
  .d-flex.justify-content-center.justify-content-md-start.flex-wrap.gap-25
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
    debounce: null
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
    getListings() {
      clearTimeout(this.debounce)
      this.debounce = setTimeout(async () => {
        this.listings = null
        this.listings = await this.getSales({
          sort: this.$route.query?.sorting?.split('-')[0] || null,
          order: this.$route.query?.sorting?.split('-')[1] || null,
          collection_name: this.$route.query?.collection,
          match: this.$route.query?.match,
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
#nfts-marketplace-sales-page {
  width: 100%;
  max-width: 970px;
  margin: 20px auto;
}
</style>
