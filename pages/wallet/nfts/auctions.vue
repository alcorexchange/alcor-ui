<template lang="pug">
#wallet-nfts-auctions-page
  .d-flex.flex-wrap.gap-25.justify-content-center.justify-content-md-start(v-if="loading")
    vue-skeleton-loader(
      v-for="idx in 4",
      :key="idx",
      :width='220',
      :height='471',
      animation='wave',
      wave-color='rgba(150, 150, 150, 0.1)',
      :rounded='true'
    )

  .d-flex.flex-wrap.gap-25.justify-content-center.justify-content-md-start(v-else)
    my-auction-card(v-for="item in auctions" :key="item.asset_id" :data="item" :ownerName="$store.state.user.name")
  AlcorLoadMore(v-if="!disabledLoadMore" @loadMore="onLoadMore" :loading="isLoadingMore")
</template>

<script>
import { mapActions, mapState } from 'vuex'
import VueSkeletonLoader from 'skeleton-loader-vue'
import MyAuctionCard from '~/components/cards/MyAuctionCard'
import AlcorLoadMore from '~/components/AlcorLoadMore'
import { NFT_LIST_ITEM_PP } from '~/config'

export default {
  components: { MyAuctionCard, VueSkeletonLoader, AlcorLoadMore },
  data: () => ({
    auctions: [],
    loading: false,
    isLoadingMore: false,
    page: 1,
    noMoreItems: false
  }),
  computed: {
    disabledLoadMore() {
      return this.loading || this.noMoreItems
    }
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
    ...mapActions('api', ['getAuctionData']),
    async getAuctions(hasLoading = true) {
      if (hasLoading) this.loading = true
      const res = await this.getAuctionData({
        ...this.$route.query,
        page: this.page
      })
      this.auctions = [...this.auctions, ...res]
      if (res.length < NFT_LIST_ITEM_PP) this.noMoreItems = true
      console.log({res, NFT_LIST_ITEM_PP});
      this.loading = false
    },
    async onLoadMore() {
      this.page++
      this.isLoadingMore = true
      await this.getAuctions(false)
      this.isLoadingMore = false
    }
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
