<template lang="pug">
card.listing-card
  asset-card-header(slot="header" :data="{...data.assets[0], owner: this.data.seller}" :ownerName="ownerName")
  asset-card-image(:template="data.assets[0].template.immutable_data")
  .p-2
    .d-flex.justify-content-between
      .d-flex.align-items-center.gap-4.w-50
        .fs-12.disable.text-truncate {{ data.collection.name }}
        img.success-icon(src='~/assets/images/check_circle.svg', alt='')
      .fs-12.disable Listed Price
    .d-flex.justify-content-between
      .fs-14.w-50.text-truncate {{ data.assets[0].name }}
      .fs-14.color-wax {{ listingPrice }} WAX
    .d-flex.justify-content-between
      .fs-12.color-action {{ data.assets[0].schema.schema_name }}
      .fs-12.color-green ${{ $systemToUSD(listingPrice) }}
  .p-2
    .d-flex.align-items-center.justify-content-between
      .fs-14 {{ timeToEnd }}
      .fs-14 {{ data.bids.length }} Bids

  .d-flex.gap-8(slot="footer")
    alcor-button.w-100(outline @click="$router.push('/nfts/' + data.asset_id)") Details
    alcor-button.w-100(access @click="openOfferModal") Make Offer
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
  props: ['data', 'ownerName'],
  computed: {
    timeToEnd() {
      const diff = this.data.end_time - Date.now()
      const time = Math.round(diff / (1000 * 60 * 60))
      const h = time % 24
      const d = Math.round(time / 24)
      return `${d}d ${h}h`
    },
    listingPrice() {
      return new Intl.NumberFormat().format(this.data.price.amount / Math.pow(10, this.data.price.token_precision))
    },
    bestOfferPrice() {
      return new Intl.NumberFormat().format(this.data.buy_offers[0].price.amount / Math.pow(10, this.data.buy_offers[0].price.token_precision))
    }
  },
  methods: {
    ...mapActions('modal', ['makeOffer']),
    openOfferModal() {
      this.makeOffer(this.data.assets[0])
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
