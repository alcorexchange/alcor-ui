<template lang="pug">
#wallet-nfts-inventory-page
  .d-flex.flex-wrap.justify-content-center.justify-content-md-start.gap-25(v-if="loading")
    vue-skeleton-loader(
      v-for="idx in 4"
      :key="idx"
      :width='220',
      :height='397',
      animation='wave',
      wave-color='rgba(150, 150, 150, 0.1)',
      :rounded='true'
    )

  .d-flex.flex-wrap.justify-content-center.justify-content-md-start.gap-25(v-else)
    inventory-card(v-for="item in inventory" :key="item.asset_id" :data="item" :ownerName="$store.state.user.name")
  AlcorLoadMore(v-if="!disabledLoadMore" @loadMore="onLoadMore" :loading="isLoadingMore")
</template>

<script>
import { mapActions, mapGetters } from 'vuex'
import VueSkeletonLoader from 'skeleton-loader-vue'
import InventoryCard from '~/components/cards/InventoryCard'
import AlcorLoadMore from '~/components/AlcorLoadMore'
import { NFT_LIST_ITEM_PP } from '~/config'

export default {
  name: 'NFTInventory',
  components: { InventoryCard, VueSkeletonLoader, AlcorLoadMore },
  data: () => ({
    inventory: [],
    loading: false,
    isLoadingMore: false,
    page: 1,
    noMoreItems: false
  }),
  computed: {
    disabledLoadMore() {
      return this.loading || this.noMoreItems
    },
    ...mapGetters(['user'])
  },
  watch: {
    '$route.query'() {
      this.getInventory()
    }
  },
  mounted() {
    this.getInventory()
  },
  methods: {
    ...mapActions('api', ['getAssets']),
    async getInventory(hasLoading = true) {
      if (hasLoading) this.loading = true
      const res = await this.getAssets({
        ...this.$route.query,
        page: this.page
      })
      this.inventory = [...this.inventory, ...res]
      if (res.length < NFT_LIST_ITEM_PP) this.noMoreItems = true
      this.loading = false
    },
    async onLoadMore() {
      this.page++
      this.isLoadingMore = true
      await this.getInventory(false)
      this.isLoadingMore = false
    }
  }
}
</script>

<style lang="scss" scoped>
#wallet-nfts-inventory-page {
  max-width: 970px;
  margin: 0 auto;
}
</style>
