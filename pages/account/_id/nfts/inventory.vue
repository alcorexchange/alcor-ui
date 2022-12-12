<template lang="pug">
.d-flex.flex-wrap.gap-25
  vue-skeleton-loader(
    v-if="!inventory"
    v-for="idx in [1, 2, 3, 4]"
    :width='220',
    :height='397',
    animation='wave',
    wave-color='rgba(150, 150, 150, 0.1)',
    :rounded='true'
  )

  asset-card(v-if="inventory" v-for="item in inventory" :key="item.asset_id" :data="item" :ownerName="$route.params.id")
</template>

<script>
import { mapActions } from 'vuex'
import VueSkeletonLoader from 'skeleton-loader-vue'
import AssetCard from '~/components/cards/AssetCard'

export default {
  components: { AssetCard, VueSkeletonLoader },
  data: () => ({
    inventory: null,
    debounce: null
  }),
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
    getInventory() {
      clearTimeout(this.debounce)
      this.debounce = setTimeout(async () => {
        this.inventory = null
        this.inventory = await this.getAssets({
          owner: this.$route.params.id,
          collection_name: this.$route.query?.collection,
          sort: this.$route.query?.sorting?.split('-')[0] || null,
          order: this.$route.query?.sorting?.split('-')[1] || null,
          match: this.$route.query?.match,
          max_template_mint: this.$route.query?.maxMint,
          min_template_mint: this.$route.query?.minMint,
          has_backed_tokens: !!this.$route.query?.isBacked,
          only_duplicate_templates: !!this.$route.query?.isDuplicates
        })
      }, 600)
    },
  }
}
</script>
