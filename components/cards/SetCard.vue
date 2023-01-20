<template lang="pug">
card.set
  asset-card-image.main-img(:template="data")
  .d-flex.justify-content-center.gap-8
    .fs-24.color-action {{ data.collection_name }}

  .w-100(slot="footer")
    alcor-button.w-100(outline @click="goToSet") {{ $t('View Set') }}

</template>

<script>
import Card from '~/components/cards/Card.vue'
import AssetCardImage from '~/components/cards/components/AssetCardImage.vue'
import AlcorButton from '~/components/AlcorButton'

export default {
  components: { Card, AssetCardImage, AlcorButton },
  props: ['data'],
  methods: {
    goToSet() {
      //this.$router.push({ name: `wallet-nfts-sets-id___${this.$i18n.locale}`, params: { id: this.data.collection_name } })
    }
  }
}
</script>

<style lang="scss" scoped>
.set {
  width: 304px;
}
</style>
