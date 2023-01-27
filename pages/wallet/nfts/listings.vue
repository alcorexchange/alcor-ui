<template lang="pug">
#wallet-nfts-listings-page
  .d-flex.flex-wrap.gap-25
    vue-skeleton-loader(
      v-if="!listings"
      v-for="idx in [1,2,3,4]"
      :key="idx"
      :width='220',
      :height='471',
      animation='wave',
      wave-color='rgba(150, 150, 150, 0.1)',
      :rounded='true'
    )
    my-listing-card(v-if="listings" v-for="item in listings" :key="item.asset_id" :data="item" :ownerName="$store.state.user.name")

</template>

<script>
import { mapActions, mapState } from 'vuex'
import VueSkeletonLoader from 'skeleton-loader-vue'
import MyListingCard from '~/components/cards/MyListingCard'

export default {
  components: { MyListingCard, VueSkeletonLoader },
  data: () => ({
    listings: null,
    debounce: null
  }),
  computed: {
    ...mapState(['user'])
  },
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
          seller: this.user.name,
          sort: this.$route.query?.sorting?.split('-')[0] || null,
          order: this.$route.query?.sorting?.split('-')[1] || null,
          collection_name: this.$route.query?.collection,
          match: this.$route.query?.match,
          max_template_mint: this.$route.query?.maxMint,
          min_template_mint: this.$route.query?.minMint,
          max_price: this.$route.query?.maxPrice,
          min_price: this.$route.query?.minPrice
        })
        const buyOffers = await this.getBuyOffers({
          seller: this.user.name,
          sort: 'price'
        })
        if (buyOffers.length)
          this.listings = this.listings.map((listing) => ({
            ...listing,
            buy_offers: []
          }))
        buyOffers.forEach(async (offer) => {
          if (offer.assets.length !== 1) return

          offer.buyerImgSrc =
            'https://wax-mainnet-ah.api.atomichub.io/v1/preview/avatar/' +
            offer.buyer

          this.listings[
            this.listings.findIndex(
              ({ assets }) => assets[0].asset_id === offer.assets[0].asset_id
            )
          ].buy_offers.push(offer)
        })
      }, 600)
    }
  }
}
</script>

<style lang="scss" scoped>
#wallet-nfts-listings-page {
  width: 100%;
  max-width: 970px;
  margin: 0 auto;
}
</style>
