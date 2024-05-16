<template lang="pug">
el-popover(placement='right' trigger='hover' width='525' :open-delay="600")
  template
    .d-flex.flex-column.gap-16.contrast
      .d-flex.gap-24.w-100
        .first-column
          asset-card-image.first-column(:template="data")
        .d-flex.flex-column.gap-16.w-100
          .d-flex.flex-column.gap-8
            .fs-24 {{ data.data.name }}
            .fs-14.d-flex.gap-4
              span Author:
              .color-action {{ data.author }}
          .d-flex.flex-column.gap-8
            .fs-14.d-flex.gap-4
              span Market Fee:
              .disable {{ data.market_fee * 100 }}%
            .fs-14.d-flex.gap-4
              span Created:
              .disable {{ date }}
            .fs-14.d-flex.gap-4
              span URL:
              .color-action {{ data.data.url }}
  .pointer(slot="reference")
    slot
</template>

<script>
import AssetCardImage from '~/components/cards/components/AssetCardImage.vue'
import ProfileImage from '~/components/ProfileImage.vue'

export default {
  components: { AssetCardImage, ProfileImage },
  props: ['data'],
  computed: {
    date() {
      const d = new Date(Date(this.data.created_at_time))
      return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`
    }
  }
}
</script>

<style lang="scss" scoped>
.first-column,
.first-column.content {
  height: 130px;
}
</style>
