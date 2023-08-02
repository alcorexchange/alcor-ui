<template lang="pug">
#nftexplorer-page
  .d-flex.justify-content-center.justify-content-md-start.flex-wrap.gap-25
    vue-skeleton-loader(
      v-if="!collections"
      v-for="idx in [1,2,3,4]"
      :key="idx"
      :width='220',
      :height='400',
      animation='wave',
      wave-color='rgba(150, 150, 150, 0.1)',
      :rounded='true'
    )
    collection-card(v-if="collections" v-for="item in collections" :key="item.asset_id" :data="item")
</template>

<script>
import { mapActions } from 'vuex'
import VueSkeletonLoader from 'skeleton-loader-vue'
import CollectionCard from '~/components/cards/CollectionCard'

export default {
  components: { CollectionCard, VueSkeletonLoader },
  data: () => ({
    collections: null,
    debounce: null
  }),
  watch: {
    '$route.query'() {
      this.exploreCollections()
    }
  },
  mounted() {
    if (!this.$route.query?.sorting) this.$router.push({ query: { ...this.$route.query, sorting: 'popularity' } })
    this.exploreCollections()
  },
  methods: {
    ...mapActions('api', ['getCollections', 'getCollectionData']),
    exploreCollections() {
      clearTimeout(this.debounce)
      this.debounce = setTimeout(async () => {
        this.collections = null
        this.$route.query?.sorting === 'popularity'
          ? (this.collections = await this.getCollections({
            search: this.$route.query?.match
          }))
          : (this.collections = await this.getCollectionData({
            search: this.$route.query?.match || null,
            sort: this.$route.query?.sorting?.split('-')[0] || null,
            order: this.$route.query?.sorting?.split('-')[1] || null
          }))
      }, 600)
    }
  }
}
</script>

<style lang="scss" scoped>
#nftexplorer-page {
  width: 100%;
  max-width: 970px;
  margin: 20px auto;
}
</style>
