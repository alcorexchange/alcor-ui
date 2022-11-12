<template lang="pug">
card
  asset-card-image.main-img(:template="data")
  .d-flex.justify-content-center.gap-8.p-2
    .fs-24.color-action {{ data.name }}
    img.success-icon(src='~/assets/images/check_circle.svg', alt='')

  .w-100(slot="footer")
    alcor-button.w-100(access @click="goToCollection")
      i.el-icon-edit-outline
      span Manage Collection

</template>

<script>
import Card from '~/components/cards/Card.vue'
import AssetCardImage from '~/components/cards/components/AssetCardImage.vue'
import AlcorButton from '~/components/AlcorButton'

export default {
  components: { Card, AssetCardImage, AlcorButton },
  props: ['data'],
  methods: {
    goToCollection() {
      console.log(this.data)
      //http://localhost:3000/nft-market/createcollection/212312e12312
      //nft-market-createcollection-collection_name___en
      this.$router.push({
        name: `nft-market-createcollection-collection_name___${this.$i18n.locale}`,
        params: { collection_name: this.data.collection_name }
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.success-icon {
  width: 20px
}
</style>

