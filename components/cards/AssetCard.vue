<template lang="pug">
asset-hover(:data="data" :ownerName="ownerName")
  card
    asset-card-header(slot="header" :data="data" :ownerName="ownerName")
    asset-card-image(:template="{ ...data.immutable_data, ...data.template.immutable_data }")
    .p-2
      .d-flex.justify-content-between
        .d-flex.align-items-center.gap-4
          .fs-12.disable.text-truncate {{ data.collection.name }}
          img.success-icon(src='~/assets/images/check_circle.svg', alt='')
      .d-flex.justify-content-between
        .fs-14.w-100.text-truncate {{ data.name }}
      .d-flex.justify-content-between
        span.fs-12.color-action {{ data.schema.schema_name }}
    .d-flex.gap-8(slot="footer")
      alcor-button.w-100(outline @click="goToDetails") {{ $t('Details') }}
      alcor-button.w-100(access @click="openOfferModal") {{ $t('Send Offer') }}
</template>

<script>
import { mapActions } from 'vuex'
import Card from '~/components/cards/Card.vue'
import AssetCardHeader from '~/components/cards/components/AssetCardHeader.vue'
import AssetCardImage from '~/components/cards/components/AssetCardImage.vue'
import AlcorButton from '~/components/AlcorButton'
import AssetHover from '~/components/alcor-element/assetHover.vue'

export default {
  components: {
    Card,
    AssetCardHeader,
    AssetCardImage,
    AlcorButton,
    AssetHover
  },
  props: ['data', 'ownerName'],
  methods: {
    ...mapActions('modal', ['makeOffer']),
    openOfferModal() {
      this.makeOffer(this.data)
    },
    goToDetails() {
      this.$router.push({
        name: `nfts-asset_id___${this.$i18n.locale}`,
        params: { asset_id: this.data.asset_id }
      })
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
