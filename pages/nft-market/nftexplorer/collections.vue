<template lang="pug">
#nftexplorer-page
  .d-flex.flex-wrap.gap-25
    vue-skeleton-loader(
      v-if="!collections"
      v-for="idx in [1,2,3,4]"
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
    this.exploreCollections()
  },
  methods: {
    ...mapActions('api', ['getCollections']),
    exploreCollections() {
      clearTimeout(this.debounce)
      this.debounce = setTimeout(async () => {
        this.collections = null
        this.collections = await this.getCollections({
          search: this.$route.query?.match,
        })
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
