<template lang="pug">
.buy-listing-component
  .title.fs-18.fw-bold.d-flex.align-items-center.gap-10.mb-3
    i.el-icon-price-tag
    span Buy Listing
  .d-flex.justify-content-between.gap-32
    NormalCard(v-if='asset', :data='asset', mode="preview")
    div
      span.fs-18.disable Summary
      .d-flex.align-items-start.gap-64.mt-3
        .d-flex.flex-column.fw-bold.gap-16
          span Sale ID:
          span Collection
          span NFT Name:
          span NFT ID:
          span Mint Number
          span Seller:
          span Backed Tokens
        .d-flex.flex-column.fw-bold.gap-16
          span {{ '#' + asset.sale_id }}
          span {{ asset.collection_name }}
            img.ml-1(src='~/assets/images/check_circle.svg', alt='')
          span {{ asset.assets[0].name }}
          span.color-green {{ '#' + asset.assets[0].asset_id }}
          span {{ asset.assets[0].template_mint }} of {{ total }}
          span {{ asset.seller }}
          span
            span.color-wax {{ new Intl.NumberFormat().format(price) }} WAX
            span.color-green  (${{ $systemToUSD(price) }})
  .d-flex.gap-16.mt-3.justify-content-end
    alcor-button Make Offer
    alcor-button(access, @click="buy")
      i.el-icon-price-tag
      span Buy for {{ new Intl.NumberFormat().format(price) }} WAX

</template>

<script>
import { mapActions } from 'vuex'
import AlcorButton from '~/components/AlcorButton'

export default {
  components: { NormalCard: () => import('~/components/nft_markets/NormalCard'), AlcorButton },
  props: ['asset'],
  data: () => ({ total: '?' }),
  computed: {
    price() { return this.asset.price.amount / Math.pow(10, this.asset.price.token_precision) }
  },
  async mounted() {
    const templateID = this.asset.assets[0].template.template_id
    const collectionName = this.asset.assets[0].collection.collection_name

    if (templateID && collectionName) {
      const { assets } = await this.$store.dispatch('api/getTemplateStats', { templateID, collectionName })
      this.total = assets
    }
  },
  methods: {
    ...mapActions('chain', ['buyAsset']),
    async buy() {
      try {
        await this.buyAsset({
          sale_id: this.asset.sale_id,
          asset_ids_to_assert: [this.asset.assets[0].asset_id],
          listing_price_to_assert: this.price.toFixed(8) + ' WAX'
        }).then(() => {
          this.$notify({
            title: 'Buy NFT',
            message: 'NFT buy successfully!',
            type: 'success'
          })
          this.$emit('success')
        })
      } catch (e) {
        console.error(e)
        this.$notify({
          title: 'Buy NFT',
          message: e.message,
          type: 'error'
        })
      }
    }
  }
}
</script>
