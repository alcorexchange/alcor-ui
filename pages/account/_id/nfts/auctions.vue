<template lang="pug">
#wallet-nfts-auctions-page
  .d-flex.flex-wrap.gap-25.justify-content-between.grid-gaps
    vue-skeleton-loader(
      v-if="!auctions"
      v-for="idx in [1,2,3,4,5]"
      :width='220',
      :height='471',
      animation='wave',
      wave-color='rgba(150, 150, 150, 0.1)',
      :rounded='true'
    )
    auction-card(v-if="auctions" v-for="item in auctions" :key="item.asset_id" :data="item" :ownerName="$route.params.id")

</template>

<script>
import { mapActions } from 'vuex'
import VueSkeletonLoader from 'skeleton-loader-vue'
import AuctionCard from '~/components/cards/AuctionCard'

export default {
  components: { AuctionCard, VueSkeletonLoader },
  data: () => ({
    auctions: null,
    ownerImgSrc: null,
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
      this.debounce = setTimeout(async () => {
        this.auctions = null
        this.auctions = await this.getAuctionData({
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
      }, 600)
    },
  }
}
</script>

<style lang="scss">
.grid-gaps {
  gap: 20px 5px;
}
</style>

