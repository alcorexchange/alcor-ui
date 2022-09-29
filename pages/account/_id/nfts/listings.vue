<template lang="pug">
.d-flex.flex-wrap.gap-28
  listing-card(v-if="listings" v-for="item in listings" :key="item.asset_id" :data="item" :ownerImgSrc="ownerImgSrc")

</template>

<script>
import { mapActions } from 'vuex'
import ListingCard from '~/components/cards/ListingCard'

export default {
  components: { ListingCard },
  data: () => ({
    listings: null,
    ownerImgSrc: null
  }),
  mounted() {
    this.getListings()
    this.getOwnerAvatar()
  },
  methods: {
    ...mapActions('social', ['getPhotoHash']),
    ...mapActions('api', ['getSales', 'getBuyOffers']),
    async getListings() {
      this.listings = await this.getSales({
        seller: this.$route.params.id
      })
      const buyOffers = await this.getBuyOffers({ seller: this.$route.params.id, sort: 'price' })
      if (buyOffers.length) this.listings = this.listings.map(listing => ({ ...listing, buy_offers: [] }))
      buyOffers.forEach(async offer => {
        if (offer.assets.length !== 1) return

        const hash = await this.getPhotoHash(offer.buyer)
        offer.buyerImgSrc = hash && `https://gateway.pinata.cloud/ipfs/${hash}`

        this.listings[
          this.listings.findIndex(({ assets }) => assets[0].asset_id === offer.assets[0].asset_id)
        ].buy_offers.push(offer)
      })
    },
    async getOwnerAvatar() {
      const hash = await this.getPhotoHash(this.$route.params.id)
      this.ownerImgSrc = hash && `https://gateway.pinata.cloud/ipfs/${hash}`
    }
  }
}
</script>

