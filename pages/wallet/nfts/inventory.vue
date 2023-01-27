<template lang="pug">
#wallet-nfts-inventory-page
  .d-flex.flex-wrap.gap-25
    vue-skeleton-loader(
      v-if="!inventory"
      v-for="idx in [1, 2, 3, 4]"
      :key="idx"
      :width='220',
      :height='397',
      animation='wave',
      wave-color='rgba(150, 150, 150, 0.1)',
      :rounded='true'
    )

    inventory-card(v-if="inventory" v-for="item in inventory" :key="item.asset_id" :data="item" :ownerName="$store.state.user.name")

</template>

<script>
import { mapActions, mapGetters } from 'vuex'
import VueSkeletonLoader from 'skeleton-loader-vue'
import InventoryCard from '~/components/cards/InventoryCard'

export default {
  components: { InventoryCard, VueSkeletonLoader },
  data: () => ({
    inventory: null,
    debounce: null
  }),
  computed: {
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
    getInventory() {
      clearTimeout(this.debounce)
      this.debounce = setTimeout(async () => {
        this.inventory = null
        this.inventory = await this.getAssets({
          owner: this.user.name,
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
