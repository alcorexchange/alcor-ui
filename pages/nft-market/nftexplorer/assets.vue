<template lang="pug">
#nftexplorer-page
  .d-flex.flex-wrap.gap-25
    vue-skeleton-loader(
      v-if="!assets"
      v-for="idx in [1,2,3,4]"
      :width='220',
      :height='400',
      animation='wave',
      wave-color='rgba(150, 150, 150, 0.1)',
      :rounded='true'
    )
    asset-card(v-if="assets" v-for="item in assets" :key="item.asset_id" :data="item")
</template>

<script>
import { mapActions } from 'vuex'
import VueSkeletonLoader from 'skeleton-loader-vue'
import AssetCard from '~/components/cards/AssetCard'

export default {
  components: { AssetCard, VueSkeletonLoader },
  data: () => ({
    assets: null,
    debounce: null
  }),
  watch: {
    '$route.query'() {
      this.exploreAssets()
    }
  },
  mounted() {
    this.exploreAssets()
  },
  methods: {
    ...mapActions('api', ['getAssets']),
    exploreAssets() {
      clearTimeout(this.debounce)
      this.debounce = setTimeout(async () => {
        this.assets = null
        this.assets = await this.getAssets({
          collection_name: this.$route.query?.collection,
          sort: this.$route.query?.sorting?.split('-')[0] || null,
          order: this.$route.query?.sorting?.split('-')[1] || null,
          ids: this.$route.query?.match,
          max_template_mint: this.$route.query?.maxMint,
          min_template_mint: this.$route.query?.minMint,
          has_backed_tokens: !!this.$route.query?.isBacked,
          only_duplicate_templates: !!this.$route.query?.isDuplicates
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

