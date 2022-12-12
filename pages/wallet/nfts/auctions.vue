<template lang="pug">
#wallet-nfts-auctions-page
  .d-flex.flex-wrap.gap-25
    vue-skeleton-loader(
      v-if="!auctions"
      v-for="idx in [1,2,3,4]"
      :width='220',
      :height='471',
      animation='wave',
      wave-color='rgba(150, 150, 150, 0.1)',
      :rounded='true'
    )
    my-auction-card(v-if="auctions" v-for="item in auctions" :key="item.asset_id" :data="item" :ownerName="$store.state.user.name")

</template>

<script>
import { mapActions, mapState } from 'vuex'
import VueSkeletonLoader from 'skeleton-loader-vue'
import MyAuctionCard from '~/components/cards/MyAuctionCard'

export default {
  components: { MyAuctionCard, VueSkeletonLoader },
  data: () => ({
    auctions: null,
    ownerName: null,
    debounce: null
  }),
  computed: {
    ...mapState(['user'])
  },
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
      }, 600)
    },
  }
}
</script>

<style lang="scss" scoped>
#wallet-nfts-auctions-page {
  width: 100%;
  max-width: 970px;
  margin: 0 auto;
}
</style>

