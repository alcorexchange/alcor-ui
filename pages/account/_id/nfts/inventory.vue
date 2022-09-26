<template lang="pug">
.d-flex.flex-wrap.gap-28
  asset-card(v-if="inventory" v-for="item in inventory" :key="item.asset_id" :data="item" :ownerImgSrc="ownerImgSrc")
</template>

<script>
import { mapActions } from 'vuex'
import AssetCard from '~/components/cards/AssetCard'

export default {
  components: { AssetCard },
  data: () => ({
    inventory: null,
    ownerImgSrc: null
  }),
  mounted() {
    this.getInventory()
    this.getOwnerAvatar()
  },
  methods: {
    ...mapActions('social', ['getPhotoHash']),
    ...mapActions('api', ['getAssets']),
    async getInventory() {
      this.inventory = await this.getAssets({
        owner: this.$route.params.id
      })
    },
    async getOwnerAvatar() {
      const hash = await this.getPhotoHash(this.$route.params.id)
      this.ownerImgSrc = hash && `https://gateway.pinata.cloud/ipfs/${hash}`
    }
  }
}
</script>
