<template lang="pug">
el-popover(placement='right' trigger='hover' width='575' :open-delay="600")
  template
    .d-flex.flex-column.gap-16.contrast
      .d-flex.gap-24.w-100
        .first-column
          asset-card-image.first-column(:template="{ ...data.immutable_data, ...data.template.immutable_data }")
        .d-flex.flex-column.gap-16.w-100
          .d-flex.flex-column.gap-8
            .fs-24.color-action {{ data.name }}
            .fs-14.d-flex.gap-4
              span ID:
              .disable {{ data.asset_id }}
          .fs-14.d-flex.gap-4.align-items-center
            span Collection:
            .d-flex.gap-4
              .disable.text-truncate {{ data.collection.name }}
              img.success-icon(src='~/assets/images/check_circle.svg', alt='')
          .d-flex.flex-column.gap-8
            .fs-14.d-flex.gap-4
              span Schema:
              .color-action.text-truncate {{ data.schema.schema_name }}
            .fs-12.d-flex.gap-4
              span Mint:
              .d-flex.align-items-center.gap-4.text-truncate
                span {{ data.template_mint }} of {{ data.template.issued_supply }} (max: {{ data.template.max_supply }})
                .color-danger -{{ data.template.issued_supply - data.template_mint }}
                img(src='~/assets/images/fire.svg')
            .fs-14.d-flex.gap-4
              span Owner:
              .d-flex.gap-4.align-items-center
                profile-image(
                  :src="`https://profile.api.atomichub.io/v1/profiles/chain/wax-mainnet/account/${ownerName}/avatar`"
                  :size="20"
                )
                .color-action.text-truncate {{ ownerName }}
            .fs-12.d-flex.gap-4(v-if="data.prices && data.prices.length")
              span Lowest Listing:
              .d-flex.gap-4.text-truncate
                .color-wax {{ lowestListing }} WAX
                .color-action (${{ $systemToUSD(lowestListing) }})

            .fs-12.d-flex.gap-4(v-if="data.prices && data.prices.length")
              span Highest Listing:
              .d-flex.gap-4.text-truncate
                .color-wax {{ highestListing }} WAX
                .color-action (${{ $systemToUSD(highestListing) }})

      .d-flex.flex-column.gap-8
        .d-flex.gap-24.align-items-start(v-for="[key, value] in Object.entries(attributes)")
          .first-column {{ key }}:
          .disable.w-49 {{ value }}

      .d-flex.justify-content-end.align-items-center.gap-8
        img(src='~/assets/images/double_arrow.svg', alt='double_arrow')
        img(src='~/assets/images/fire.svg', alt='fire')
        span Minted:
        .disable {{ date }}

  .pointer(slot="reference")
    slot
</template>

<script>
import AssetCardImage from '~/components/cards/components/AssetCardImage.vue'
import ProfileImage from '~/components/ProfileImage.vue'

export default {
  components: { AssetCardImage, ProfileImage },
  props: ['data', 'ownerName'],
  computed: {
    attributes() {
      const keyFilters = ['img', 'backimg', 'video']
      return Object.entries(this.data.data)
        .filter(
          ([key, value]) => !keyFilters.includes(key) && !key.includes('img')
        )
        .map(([key, value]) => [
          (key.charAt(0).toUpperCase() + key.slice(1)).replaceAll('_', ' '),
          ('' + value).replaceAll('_', ' ')
        ])
        .reduce((obj, [key, value]) => ({ ...obj, [key]: value }), {})
    },
    lowestListing() {
      return (
        this.data.prices[0].min /
        Math.pow(10, this.data.prices[0].token.token_precision)
      ).toFixed(2)
    },
    highestListing() {
      return (
        this.data.prices[0].max /
        Math.pow(10, this.data.prices[0].token.token_precision)
      ).toFixed(2)
    },
    date() {
      return new Date(+this.data.minted_at_time).toLocaleString()
    }
  }
}
</script>

<style lang="scss" scoped>
.first-column,
.first-column.content {
  width: 225px;
}
</style>
