<template lang="pug">
#offer-preview-component.d-flex.flex-column.gap-16
  .d-flex.justify-content-between.align-items-center.w-100
    .d-flex.gap-4.fs-14
      span ID:
      router-link(:to="{ name: `trading-trade-offers-id___${$i18n.locale}`, params: { id: offer.offer_id } }")
        .color-wax {{ '#' + offer.offer_id }}
      span Created:
      span {{ date }}

    .d-flex.gap-4
      alcor-button(outline @click="cancelOffer")
        i.el-icon-delete
        span Cancel
  .d-flex.gap-8.flex-column.details
    .d-flex.justify-content-between.align-items-center
      .d-flex.align-items-center.justify-content-center.gap-4.w-100.fs-14.pointer(@click="goToProfile(offer.sender_name)")
        profile-image(:src="'https://wax-mainnet-ah.api.atomichub.io/v1/preview/avatar/' + offer.sender_name" :size="20")
        .color-wax {{ offer.sender_name }}
        span -
        strong {{ offer.sender_assets.length }}
        span NFT(s)

      .d-flex.align-items-center.justify-content-center.gap-4.w-100.fs-14.pointer(@click="goToProfile(offer.recipient_name)")
        profile-image(:src="'https://wax-mainnet-ah.api.atomichub.io/v1/preview/avatar/' + offer.recipient_name" :size="20")
        .color-wax {{ offer.recipient_name }}
        span -
        strong {{ offer.recipient_assets.length }}
        span NFT(s)

    .d-flex.justify-content-center.align-items-center
      assets-field.assets(v-if="offer.sender_assets.length" :assets="offer.sender_assets" smallCards="true")
      .null-card(v-else) 0
      i.el-icon-sort.r-45
      assets-field.assets(v-if="offer.recipient_assets.length" :assets="offer.recipient_assets" smallCards="true")
      .null-card(v-else) 0

  alcor-collapse(v-if="offer.memo")
    .d-flex.align-items-center.gap-8(slot="title")
      i.el-icon-chat-square
      .fs-14 Message
    .d-flex.align-items-center.gap-4.fs-12
      profile-image(:src="'https://wax-mainnet-ah.api.atomichub.io/v1/preview/avatar/' + offer.sender_name" :size="20")
      span {{ offer.sender_name }}
    .ml-4.mt-2.message {{ offer.memo }}

</template>

<script>
import AlcorButton from '~/components/AlcorButton'
import AlcorCollapse from '~/components/AlcorCollapse'
import AssetsField from '~/components/nft_markets/AssetsField'
import ProfileImage from '~/components/ProfileImage.vue'

export default {
  components: { AlcorButton, AlcorCollapse, AssetsField, ProfileImage },
  props: ['offer', 'offerLog'],
  computed: {
    date() {
      return new Date(+this.offer.created_at_time).toLocaleString()
    }
  },
  methods: {
    goToProfile(id) {
      this.$router.push({
        name: `account-id-nfts-inventory___${this.$i18n.locale}`,
        params: { id },
        query: {
          match: '',
          collection: null,
          sorting: null,
          minMint: null,
          maxMint: null,
          minPrice: null,
          maxPrice: null,
          isDuplicates: null,
          isBacked: null
        }
      })
    },
    async cancelOffer() {
      await this.$store.dispatch('chain/cancelOffers', [this.offer.offer_id])
    }
  }
}
</script>

<style lang="scss" scoped>
#offer-preview-component {
  width: 730px;
  padding: 24px;
  border-radius: 1rem;
  background-color: var(--bg-alter-2);

  .null-card {
    width: 170px;
    margin: 0 60px;
    height: 270px;
    border: var(--border-1);
    border-radius: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .details {
    background-color: var(--background-color-secondary);
    border-radius: 0.5rem;
    margin-top: 16px;
    padding: 42px;
  }
  .assets {
    border: none;
    width: 300px;
    height: 320px;
  }
  .r-45 {
    transform: rotate(90deg);
  }
  .message {
    padding: 10px;
    background-color: var(--bg-alter-2);
    border-radius: 0 5px 5px 5px;
    width: fit-content;
  }
}
</style>
