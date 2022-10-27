<template lang="pug">
card.listing-card
  asset-card-header(slot="header" :data="data.assets[0]" :ownerImgSrc="ownerImgSrc")
  asset-card-image(:template="data.assets[0].template.immutable_data")
  .p-2
    .d-flex.justify-content-between
      .d-flex.align-items-center.gap-4
        .fs-12.disable {{ data.collection.name }}
        img.success-icon(src='~/assets/images/check_circle.svg', alt='')
      .fs-12.disable Listed Price
    .d-flex.justify-content-between
      span {{ data.assets[0].name }}
      .color-wax {{ listingPrice }} WAX
    .d-flex.justify-content-between
      span.fs-12.color-action {{ data.assets[0].schema.schema_name }}
  .p-2(v-if="data.end_time && data.bids.length")
    .d-flex.justify-content-between
      .d-flex.align-items-center.gap-4.pointer
        span {{ date.end_time }}
        pre {{ data.bids }}
      .color-wax {{ bestOfferPrice }} WAX

  .d-flex.gap-8(slot="footer")
    alcor-button.w-100(outline @click="$router.push('/nfts/' + data.asset_id)") Details
    alcor-button.w-100(access @click="openEditModal") Manage
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
      this.listing({ ...this.data, mode: 'auctions' })
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
