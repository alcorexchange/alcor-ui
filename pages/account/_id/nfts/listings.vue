<template lang="pug">
.d-flex.flex-wrap.gap-25
  vue-skeleton-loader(
    v-if="!listings"
    v-for="idx in [1,2,3,4]"
    :width='220',
    :height='471',
    animation='wave',
    wave-color='rgba(150, 150, 150, 0.1)',
    :rounded='true'
  )

  listing-card(v-if="listings" v-for="item in listings" :key="item.asset_id" :data="item" :ownerName="$route.params.id")

</template>

<script>
import { mapActions } from 'vuex'
import VueSkeletonLoader from 'skeleton-loader-vue'
import ListingCard from '~/components/cards/ListingCard'

export default {
  components: { ListingCard, VueSkeletonLoader },
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
          seller: this.$route.params.id,
          sort: this.$route.query?.sorting?.split('-')[0] || null,
          order: this.$route.query?.sorting?.split('-')[1] || null,
          collection_name: this.$route.query?.collection,
          match: this.$route.query?.match,
          max_template_mint: this.$route.query?.maxMint,
          min_template_mint: this.$route.query?.minMint,
          max_price: this.$route.query?.maxPrice,
          min_price: this.$route.query?.minPrice
        })
        const buyOffers = await this.getBuyOffers({ seller: this.$route.params.id, sort: 'price' })
        if (buyOffers.length) this.listings = this.listings.map(listing => ({ ...listing, buy_offers: [] }))
        buyOffers.forEach(offer => {
          if (offer.assets.length !== 1) return

          offer.buyerImgSrc = 'https://wax-mainnet-ah.api.atomichub.io/v1/preview/avatar/' + offer.buyer

          this.listings[
            this.listings.findIndex(({ assets }) => assets[0].asset_id === offer.assets[0].asset_id)
          ].buy_offers.push(offer)
        })
      }, 600)
    },
  }
}
</script>

