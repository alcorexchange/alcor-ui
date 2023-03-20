<template lang="pug">
#wallet-nfts-listings-page
  .d-flex.flex-wrap.gap-25.justify-content-center.justify-content-md-start(v-if="loading")
    vue-skeleton-loader(
      v-for="idx in [1,2,3,4]"
      :key="idx"
      :width='220',
      :height='471',
      animation='wave',
      wave-color='rgba(150, 150, 150, 0.1)',
      :rounded='true'
    )
  .d-flex.flex-wrap.gap-25.justify-content-center.justify-content-md-start(v-else)
    my-listing-card(v-for="item in listings" :key="item.asset_id" :data="item" :ownerName="$store.state.user.name")

</template>

<script>
import { mapActions, mapState } from 'vuex'
import VueSkeletonLoader from 'skeleton-loader-vue'
import MyListingCard from '~/components/cards/MyListingCard'

export default {
  components: { MyListingCard, VueSkeletonLoader },
  data: () => ({
    listings: [],
    debounce: null,
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
      const buyOffers = await this.getBuyOffers()
      this.loading = false

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
