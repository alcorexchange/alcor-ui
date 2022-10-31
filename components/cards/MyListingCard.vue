<template lang="pug">
card.listing-card
  asset-card-header(slot="header" :data="data.assets[0]" :ownerImgSrc="ownerImgSrc")
  asset-card-image(:template="data.assets[0].template.immutable_data")
  .p-2
    .d-flex.justify-content-between
      .d-flex.align-items-center.gap-4.w-50
        .fs-12.disable.text-truncate {{ data.collection.name }}
        img.success-icon(src='~/assets/images/check_circle.svg', alt='')
      .fs-12.disable Listed Price
    .d-flex.justify-content-between
      span {{ data.assets[0].name }}
      .color-wax {{ listingPrice }} WAX
    .d-flex.justify-content-between
      span.fs-12.color-action {{ data.assets[0].schema.schema_name }}
  .p-2(v-if="data.buy_offers && data.buy_offers.length")
    .d-flex.justify-content-between
      .fs-12.disable Best offer by
    .d-flex.justify-content-between
      .d-flex.align-items-center.gap-4.pointer
        profile-image(:src="data.buy_offers[0].buyerImgSrc" :size="12")
        .color-action.fs-12 {{ data.buy_offers[0].buyer }}
      .color-wax {{ bestOfferPrice }} WAX
    .d-flex.justify-content-between
      span
      .color-green.fs-12 (${{ $systemToUSD(bestOfferPrice) }})

  .d-flex.gap-8(slot="footer")
    alcor-button.w-100(outline @click="$router.push('/nfts/' + data.asset_id)") Details
    alcor-button.w-100(access @click="openEditModal") Edit
</template>

<script>
import { mapActions } from 'vuex'
import Card from '~/components/cards/Card.vue'
import AssetCardHeader from '~/components/cards/components/AssetCardHeader.vue'
import AssetCardImage from '~/components/cards/components/AssetCardImage.vue'
import ProfileImage from '~/components/ProfileImage.vue'
import AlcorButton from '~/components/AlcorButton'

export default {
  components: { Card, AssetCardHeader, AssetCardImage, AlcorButton, ProfileImage },
  props: ['data', 'ownerImgSrc'],
  computed: {
    listingPrice() {
      return new Intl.NumberFormat().format(this.data.price.amount / Math.pow(10, this.data.price.token_precision))
    },
    bestOfferPrice() {
      return new Intl.NumberFormat().format(this.data.buy_offers[0].price.amount / Math.pow(10, this.data.buy_offers[0].price.token_precision))
    }
  },
  methods: {
    ...mapActions('modal', ['listing']),
    openEditModal() {
      this.listing({ ...this.data, mode: 'sales' })
    }
  }
}
</script>

<style scoped lang="scss">
.listing-card {
  height: 471px;
}

.success-icon {
  width: 10px;
  height: 10px;
}
</style>
