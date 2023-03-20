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
  AlcorLoadMore(v-if="!disabledLoadMore" @loadMore="onLoadMore" :loading="isLoadingMore")
</template>

<script>
import { mapActions, mapState } from 'vuex'
import VueSkeletonLoader from 'skeleton-loader-vue'
import MyListingCard from '~/components/cards/MyListingCard'
import AlcorLoadMore from '~/components/AlcorLoadMore'
import { NFT_LIST_ITEM_PP } from '~/config'

export default {
  components: { MyListingCard, VueSkeletonLoader, AlcorLoadMore },
  data: () => ({
    listings: [],
    loading: false,
    isLoadingMore: false,
    page: 1,
    noMoreItems: false
  }),
  watch: {
    '$route.query'() {
      this.getListings()
    }
  },
  mounted() {
    this.getListings()
  },
  computed: {
    disabledLoadMore() {
      return this.loading || this.noMoreItems
    },
  },
  methods: {
    ...mapActions('api', ['getSales', 'getBuyOffers']),
    async getListings(hasLoading = true) {
      if (hasLoading) this.loading = true
      const res = await this.getSales({
        ...this.$route.query,
        page: this.page
      })
      this.listings = [...this.listings, ...res]
      const buyOffers = await this.getBuyOffers()
      if (res.length < NFT_LIST_ITEM_PP) this.noMoreItems = true
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
    },
    async onLoadMore() {
      this.page++
      this.isLoadingMore = true
      await this.getListings(false)
      this.isLoadingMore = false
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
