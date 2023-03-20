<template lang="pug">
#wallet-nfts-sold-page
  .d-flex.gap-32.justify-content-between(v-if='loading')
    vue-skeleton-loader(
      :width='600',
      :height='380',
      animation='wave',
      wave-color='rgba(150, 150, 150, 0.1)',
      :rounded='true'
    )
    vue-skeleton-loader(
      :width='220',
      :height='380',
      animation='wave',
      wave-color='rgba(150, 150, 150, 0.1)',
      :rounded='true'
    )
  div(v-else)
    detail-with-card-panel(
      v-for='(item, index) in solds',
      :key='index',
      :data='item',
      mode='sold'
    )
  AlcorLoadMore(v-if="!disabledLoadMore" @loadMore="onLoadMore" :loading="isLoadingMore")
</template>

<script>
import VueSkeletonLoader from 'skeleton-loader-vue'
import DetailWithCardPanel from '~/components/nft_markets/DetailWithCardPanel'
import AlcorLoadMore from '~/components/AlcorLoadMore'
import { NFT_LIST_ITEM_PP } from '~/config'

export default {
  components: { VueSkeletonLoader, DetailWithCardPanel, AlcorLoadMore },
  data: () => ({
    solds: [],
    loading: true,
    isLoadingMore: false,
    page: 1,
    noMoreItems: false
  }),
  computed: {
    disabledLoadMore() {
      return this.loading || this.noMoreItems
    },
  },
  watch: {
    '$route.query'() {
      this.getSold()
    }
  },
  mounted() {
    this.getSold()
  },
  methods: {
    async getSold(hasLoading = true) {
      if (hasLoading) this.loading = true
      const res = await this.$store.dispatch('api/getSales', {
        state: '3',
        ...this.$route.query,
        page: this.page
      })
      this.solds = hasLoading ? res : [...this.solds, ...res]
      if (res.length < NFT_LIST_ITEM_PP) this.noMoreItems = true
      this.loading = false
    },
    async onLoadMore() {
      this.page++
      this.isLoadingMore = true
      await this.getSold(false)
      this.isLoadingMore = false
    }
  }
}
</script>

<style lang="scss" scoped>
#wallet-nfts-sold-page {
  max-width: 970px;
  margin: 0 auto;
}
</style>
