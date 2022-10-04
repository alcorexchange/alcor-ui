<template lang="pug">
.d-flex.flex-wrap.gap-25
  asset-card(v-if="inventory" v-for="item in inventory" :key="item.asset_id" :data="item" :ownerImgSrc="ownerImgSrc")
</template>

<script>
import { mapActions } from 'vuex'
import AssetCard from '~/components/cards/AssetCard'

export default {
  components: { AssetCard },
  data: () => ({
    inventory: null,
    ownerImgSrc: null,
    debounce: null
  }),
  watch: {
    '$route.query'() {
      this.getInventory()
    }
  },
  mounted() {
    this.getInventory()
    this.getOwnerAvatar()
  },
  methods: {
    ...mapActions('social', ['getPhotoHash']),
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
    async getOwnerAvatar() {
      const hash = await this.getPhotoHash(this.$route.params.id)
      this.ownerImgSrc = hash && `https://gateway.pinata.cloud/ipfs/${hash}`
    }
  }
}
</script>
