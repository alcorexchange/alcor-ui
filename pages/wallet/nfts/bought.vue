<template lang="pug">
#wallet-nfts-bought-page
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
    DetailWithCardPanel(
      v-for='(item, index) in boughts',
      :key='index',
      :data='item',
      mode='bought'
    )
  AlcorLoadMore(v-if="!disabledLoadMore" @loadMore="onLoadMore" :loading="isLoadingMore")
</template>

<script>
import { mapState } from 'vuex'
import VueSkeletonLoader from 'skeleton-loader-vue'
import DetailWithCardPanel from '~/components/nft_markets/DetailWithCardPanel'
import AlcorLoadMore from '~/components/AlcorLoadMore'
import { NFT_LIST_ITEM_PP } from '~/config'

export default {
  components: { VueSkeletonLoader, DetailWithCardPanel, AlcorLoadMore },
  data: () => ({
    boughts: [],
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
      this.getBoughts()
    }
  },
  mounted() {
    this.getBoughts()
  },
  methods: {
    async getBoughts(hasLoading = true) {
      if (hasLoading) this.loading = true
      const res = await this.$store.dispatch('api/getSales', {
        state: '3',
        ...this.$route.query,
        seller: this.$store.user.name,
        page: this.page
      })
      this.boughts = hasLoading ? res : [...this.boughts, ...res]
      if (res.length < NFT_LIST_ITEM_PP) this.noMoreItems = true
      this.loading = false
    },
    async onLoadMore() {
      this.page++
      this.isLoadingMore = true
      await this.getBoughts(false)
      this.isLoadingMore = false
    }
  }
}
</script>

<style lang="scss" scoped>
#wallet-nfts-bought-page {
  max-width: 970px;
  margin: 0 auto;
}

</style>
