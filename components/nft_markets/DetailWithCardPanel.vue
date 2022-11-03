<template lang="pug">
.detailWithCardPanel.mb-5.d-flex.gap-32.justify-content-between
  .nft-info.border-radius5.d-flex.flex-column.normal-card-shadow
    .d-flex.gap-64
      .d-flex.flex-column.gap-16
        .d-flex.flex-column
          .fs-14.disable Sale ID
          .fs-18 {{ "#" + saleID }}
        .d-flex.flex-column
          .fs-14.disable Seller
          .d-flex.gap-4
            profile-image(:src="ownerImgSrc" :size="20")
            span {{ data.seller }}
        .d-flex.flex-column
          .fs-14.disable Price
          .d-flex.gap-4
            .color-wax {{ price + " WAX" }}
            .color-action (${{ $systemToUSD(price) }})
        .d-flex.flex-column
          .fs-14.disable Date
          span {{ +data.assets[0].transferred_at_time | moment("MM/DD/YYYY HH:mm a") }}

      .d-flex.flex-column.gap-16
        .d-flex.flex-column
          .fs-14.disable Mint Number
          .fs-18.d-flex.gap-4
            .color-action {{ data.assets[0].template_mint }}
            span of {{ data.assets[0].template.issued_supply }} (max: {{ data.assets[0].template.max_supply }}) -
            .color-danger {{ data.assets[0].template.issued_supply - data.assets[0].template_mint }}
            img(src='~/assets/images/fire.svg')
        .d-flex.flex-column
          .fs-14.disable Temlate ID
          .color-action {{ "#" + data.assets[0].template.template_id }}
        .d-flex.flex-column
          .fs-14.disable Propertise
          .d-flex.gap-4(v-if='data.assets[0].template.is_transferable')
            img(src='~/assets/images/double_arrow.svg')
            .fs-18 Transferable
          .d-flex.gap-4(v-if='data.assets[0].template.is_burnable')
            img(src='~/assets/images/fire.svg')
            .fs-18 Burnable

  preview-card(:data='data.assets[0]')
    alcor-button.w-100(outline slot="footer" @click="$router.push('/nfts/' + data.assets[0].asset_id)") Details
</template>

<script>
import { mapActions } from 'vuex'
import ProfileImage from '~/components/ProfileImage.vue'
import PreviewCard from '~/components/cards/PreviewCard'
import AlcorButton from '~/components/AlcorButton'

export default {
  components: { PreviewCard, ProfileImage, AlcorButton },
  props: ['data', 'mode'],
  data: () => ({ ownerImgSrc: null }),
  computed: {
    saleID() {
      if (this.data.auction_id) {
        return this.data.auction_id
      } else return this.data.sale_id
    },
    price() {
      if (this.data.price) {
        return (
          this.data.price.amount / Math.pow(10, this.data.price.token_precision)
        )
      } else return 0
    }
  },
  mounted() {
    this.getOwnerAvatar()
  },
  methods: {
    ...mapActions('social', ['getPhotoHash']),
    async getOwnerAvatar() {
      const hash = await this.getPhotoHash(this.data.seller)
      this.ownerImgSrc = hash && `https://gateway.pinata.cloud/ipfs/${hash}`
    }
  }
}
</script>

<style lang="scss" scoped>
.nft-info {
  width: 595px;
  background-color: var(--background-color-third);
  padding: 14px;
}
.border-radius5 {
  border-radius: 5px;
}
.other-info {
  width: 40%;
  h4 {
    font-size: 20px;
  }
}

.wax-price {
  color: #f89022;
}
.nft {
  width: auto;
  height: auto;
}
.wax-exchange {
  font-weight: 500;
  font-size: 16px;
  color: #34fb24;
}
.description-name,
.wax-exchange {
  margin-bottom: 15px !important;
}
.description-fee,
.description-title {
  font-size: 14px;
  color: var(--cancel);
  margin-bottom: 5px;
  span {
    margin-left: 4px;
  }
}
.color-red {
  color: #ff4949;
  margin-right: 5px;
}
</style>
