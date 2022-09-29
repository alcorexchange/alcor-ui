<template lang="pug">
card
  asset-card-header(slot="header" :data="data" :ownerImgSrc="ownerImgSrc")
  asset-card-image(:template="{ ...data.immutable_data, ...data.template.immutable_data }")
  .p-2
    .d-flex.justify-content-between
      .d-flex.align-items-center.gap-4
        .fs-12.disable {{ data.collection.name }}
        img.success-icon(src='~/assets/images/check_circle.svg', alt='')
    .d-flex.justify-content-between
      span {{ data.name }}
    .d-flex.justify-content-between
      span.fs-12.color-action {{ data.schema.schema_name }}
  .d-flex.gap-8(slot="footer")
    alcor-button.w-100(outline @click="$router.push('/nfts/' + data.asset_id)") Details
    alcor-button.w-100(access @click="openOfferModal") Send Offer
</template>

<script>
import { mapActions } from 'vuex'
import Card from '~/components/cards/Card.vue'
import AssetCardHeader from '~/components/cards/components/AssetCardHeader.vue'
import AssetCardImage from '~/components/cards/components/AssetCardImage.vue'
import AlcorButton from '~/components/AlcorButton'

export default {
  components: { Card, AssetCardHeader, AssetCardImage, AlcorButton },
  props: ['data', 'ownerImgSrc'],
  methods: {
    ...mapActions('modal', ['makeOffer']),
    openOfferModal() {
      this.makeOffer(this.data)
    }
  }
}
</script>

<style scoped lang="scss">
.success-icon {
  width: 10px;
  height: 10px;
}
</style>
