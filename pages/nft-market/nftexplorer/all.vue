<template lang="pug">
#nftexplorer-page
  .fs-36.p-3 {{ $t('Collections') }}
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

    .fs-36.p-3 {{ $t('Templates') }}
  .d-flex.justify-content-center.justify-content-md-start.flex-wrap.gap-25
    vue-skeleton-loader(
      v-if="!templates"
      v-for="idx in [1,2,3,4]"
      :key="idx"
      :width='220',
      :height='400',
      animation='wave',
      wave-color='rgba(150, 150, 150, 0.1)',
      :rounded='true'
    )
    template-card(v-if="templates" v-for="item in templates" :key="item.template_id" :data="item")

  .fs-36.p-3 NFTs
  .d-flex.justify-content-center.justify-content-md-start.flex-wrap.gap-25
    vue-skeleton-loader(
      v-if="!assets"
      v-for="idx in [1,2,3,4]"
      :key="idx"
      :width='220',
      :height='400',
      animation='wave',
      wave-color='rgba(150, 150, 150, 0.1)',
      :rounded='true'
    )
    asset-card(v-if="assets" v-for="item in assets" :key="item.asset_id" :data="item" :ownerName="item.owner")
</template>

<script>
import { mapActions } from 'vuex'
import VueSkeletonLoader from 'skeleton-loader-vue'
import AssetCard from '~/components/cards/AssetCard'
import CollectionCard from '~/components/cards/CollectionCard'
import TemplateCard from '~/components/cards/TemplateCard'

export default {
  components: { AssetCard, CollectionCard, TemplateCard, VueSkeletonLoader },
  data: () => ({
    assets: null,
    collections: null,
    templates: null,
    debounce: null
  }),
  watch: {
    '$route.query'() {
      this.explore()
    }
  },
  mounted() {
    this.explore()
  },
  methods: {
    ...mapActions('api', [
      'getAssets',
      'getCollectionData',
      'getTemplatesData'
    ]),
    explore() {
      clearTimeout(this.debounce)
      this.debounce = setTimeout(async () => {
        this.assets = null
        this.assets = await this.getAssets({
          ids: this.$route.query?.match,
          limit: '8'
        })

        this.collections = null
        this.collections = await this.getCollectionData({
          search: this.$route.query?.match || null,
          limit: '8'
        })

        this.templates = null
        this.templates = await this.getTemplatesData({
          search: this.$route.query?.match,
          limit: '8'
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
