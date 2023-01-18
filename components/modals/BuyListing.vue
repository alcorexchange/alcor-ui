<template lang="pug">
.buy-listing-component
  .title.fs-18.fw-bold.d-flex.align-items-center.gap-10.mb-3
    i.el-icon-price-tag
    span Buy Listing
  .d-flex.justify-content-between.gap-32
    preview-card(v-if='context.assets[0]', :data='context.assets[0]' :ownerName="context.assets[0].owner")
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
          locale-link(:to="`/sale/${context.sale_id}`" target="_blank") {{ '#' + context.sale_id }}
          span {{ context.collection_name }}
            img.ml-1(src='~/assets/images/check_circle.svg', alt='')
          span {{ context.assets[0].name }}
          span.color-green {{ '#' + context.assets[0].asset_id }}
          span {{ context.assets[0].template_mint }} of {{ total }}
          span {{ context.seller }}
          span
            span.color-wax {{ new Intl.NumberFormat().format(price) }} WAX
            span.color-green  (${{ $systemToUSD(price) }})
  .d-flex.gap-16.mt-3.justify-content-end
    alcor-button(@click="openOfferModal") Make Offer
    alcor-button(access, @click="buy")
      i.el-icon-price-tag
      span Buy for {{ new Intl.NumberFormat().format(price) }} WAX

</template>

<script>
import { mapActions, mapState } from 'vuex'
import AlcorButton from '~/components/AlcorButton'
import PreviewCard from '~/components/cards/PreviewCard'
import LocaleLink from '~/components/elements/LocaleLink'

export default {
  components: { PreviewCard, AlcorButton, LocaleLink },
  data: () => ({ total: '?' }),
  computed: {
    ...mapState('modal', ['context']),
    price() {
      return (
        this.context.price.amount /
        Math.pow(10, this.context.price.token_precision)
      )
    }
  },
  async mounted() {
    const templateID = this.context.assets[0].template.template_id
    const collectionName = this.context.assets[0].collection.collection_name

    if (templateID && collectionName) {
      const { assets } = await this.$store.dispatch('api/getTemplateStats', {
        templateID,
        collectionName
      })
      this.total = assets
    }
  },
  methods: {
    ...mapActions('chain', ['buyAsset']),
    ...mapActions('modal', ['makeOffer', 'closeModal']),
    openOfferModal() {
      this.makeOffer(this.context.assets[0])
    },
    async buy() {
      try {
        await this.buyAsset({
          sale_id: this.context.sale_id,
          asset_ids_to_assert: [this.context.assets[0].asset_id],
          listing_price_to_assert: this.price.toFixed(8) + ' WAX'
        }).then(() => {
          this.$notify({
            title: 'Buy NFT',
            message: 'NFT buy successfully!',
            type: 'success'
          })
          this.$router.push({
            name: `wallet-nfts___${this.$i18n.locale}`
          })
          this.closeModal()
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
