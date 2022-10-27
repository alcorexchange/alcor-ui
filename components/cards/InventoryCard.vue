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
  .d-flex.flex-column.gap-8(slot="footer")
    .d-flex.gap-8(slot="footer")
      alcor-button.w-100(@click="openListingModal")
        i.el-icon-news
        span Sell NFT
      el-dropdown.w-100(trigger='click')
        alcor-button.w-100(access)
          span More
          i.el-icon-arrow-down
        el-dropdown-menu.dropdown
          el-dropdown-item.dropdown__item
            .dropdown__inner(@click="openTransferModal")
              i.el-icon-takeaway-box
              span Transfer
          el-dropdown-item.dropdown__item
            .dropdown__inner(@click="")
              i.el-icon-sort.rot-90
              span New Trade
          el-dropdown-item.dropdown__item
            .dropdown__inner(@click="openCreateGiftLinkModal")
              i.el-icon-link
              span Create Gift Link
          el-dropdown-item.dropdown__item
            .dropdown__inner(@click="openBurnModal")
              i.el-icon-takeaway-box
              span Burn

    alcor-button.w-100(outline @click="$router.push('/nfts/' + data.asset_id)") Details
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
    ...mapActions('modal', ['listing', 'transfer', 'burn', 'gift']),
    openListingModal() {
      this.listing(this.data)
    },
    openCreateGiftLinkModal() {
      this.gift({ ...this.data, giftAssets: [this.data] })
    },
    openTransferModal() {
      this.transfer({ ...this.data, transferAssets: [this.data] })
    },
    openBurnModal() {
      this.burn(this.data)
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
