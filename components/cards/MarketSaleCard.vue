<template lang="pug">
asset-hover(:data="data.assets[0]" :ownerName="ownerName")
  card
    asset-card-header(slot="header" :data="data.assets[0]" :ownerName="ownerName")
    asset-card-image(v-if="data.assets[0].template" :template="data.assets[0].template.immutable_data")
    asset-card-image(v-else-if="data.assets[0].immutable_data" :template="data.assets[0].immutable_data")
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
        span.fs-12.color-action {{ data.assets[0].schema.schema_name }}
        .fs-12.color-green ${{ $systemToUSD(listingPrice) }}

    .d-flex.gap-8(slot="footer")
      alcor-button.w-100(outline @click="$router.push('/nfts/' + data.assets[0].asset_id )") Details
      alcor-button.w-100(access @click="openBuyModal") Buy
</template>

<script>
import { mapActions } from 'vuex'
import Card from '~/components/cards/Card.vue'
import AssetCardHeader from '~/components/cards/components/AssetCardHeader.vue'
import AssetCardImage from '~/components/cards/components/AssetCardImage.vue'
import ProfileImage from '~/components/ProfileImage.vue'
import AlcorButton from '~/components/AlcorButton'
import AssetHover from '~/components/alcor-element/assetHover.vue'

export default {
  components: {
    Card,
    AssetCardHeader,
    AssetCardImage,
    AlcorButton,
    ProfileImage,
    AssetHover
  },
  props: ['data', 'ownerName'],
  computed: {
    listingPrice() {
      return new Intl.NumberFormat().format(
        this.data.price.amount / Math.pow(10, this.data.price.token_precision)
      )
    },
    bestOfferPrice() {
      return new Intl.NumberFormat().format(
        this.data.buy_offers[0].price.amount /
          Math.pow(10, this.data.buy_offers[0].price.token_precision)
      )
    }
  },
  methods: {
    ...mapActions('modal', ['buy']),
    openBuyModal() {
      this.buy(this.data)
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
