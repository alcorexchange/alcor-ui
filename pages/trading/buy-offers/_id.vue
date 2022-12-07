<template lang="pug">
#trade-offer-page.d-flex.flex-column.gap-16.mt-2
  bread-crumbs
  .fs-36.d-flex.gap-8
    span Trade Offer:
    .color-wax {{ '#' + $route.params.id }}
  .offer-details.d-flex.flex-column.gap-16(v-if="offer")
    .d-flex.justify-content-between
      .d-flex.gap-4
        span Trade Offer ID:
        .color-wax {{ '#' + $route.params.id }}
      .d-flex.gap-4
        span Created:
        .color-wax {{ date }}
    .d-flex.justify-content-between
      span
      alcor-button(outline @click="cancelOffer")
        i.el-icon-delete
        span Cancel

    .d-flex.align-items-center.gap-4.w-100.fs-14.pointer(@click="goToProfile(offer.sender_name)")
      profile-image(:src="'https://wax-mainnet-ah.api.atomichub.io/v1/preview/avatar/' + offer.sender_name" :size="20")
      .color-wax {{ offer.sender_name }}
    .assets-wrapper
      assets-field.assets(v-if="offer.sender_assets.length" :assets="offer.sender_assets" smallCards="true")
      .null-card(v-else) No NFTs

    .d-flex.align-items-center.gap-4.w-100.fs-14.pointer(@click="goToProfile(offer.recipient_name)")
      profile-image(:src="'https://wax-mainnet-ah.api.atomichub.io/v1/preview/avatar/' + offer.recipient_name" :size="20")
      .color-wax {{ offer.recipient_name }}
    .assets-wrapper
      assets-field.assets(v-if="offer.recipient_assets.length" :assets="offer.recipient_assets" smallCards="true")
      .null-card(v-else) No NFTs

    alcor-collapse(v-if="offer.memo")
      .d-flex.align-items-center.gap-8(slot="title")
        i.el-icon-chat-square
        .fs-14 Message
      .d-flex.align-items-center.gap-4.fs-12
        profile-image(:src="'https://wax-mainnet-ah.api.atomichub.io/v1/preview/avatar/' + offer.sender_name" :size="20")
        span {{ offer.sender_name }}
      .ml-4.mt-2.message {{ offer.memo }}

  .offer-details(v-if="offerLog")
    table-log(:offerLog="offerLog")

</template>

<script>
import { mapActions } from 'vuex'
import BreadCrumbs from '~/components/elements/BreadCrumbs.vue'
import AlcorButton from '~/components/AlcorButton'
import ProfileImage from '~/components/ProfileImage.vue'
import AssetsField from '~/components/nft_markets/AssetsField'
import AlcorCollapse from '~/components/AlcorCollapse'
import TableLog from '~/components/trading/TableLog'

export default {
  components: {
    BreadCrumbs,
    AlcorButton,
    ProfileImage,
    AssetsField,
    AlcorCollapse,
    TableLog
  },
  data: () => ({ offer: null, offerLog: null }),
  computed: {
    date() {
      return new Date(+this.offer?.created_at_time).toLocaleString()
    }
  },
  mounted() {
    this.getOffer()
    this.fetchOfferLog()
  },
  methods: {
    ...mapActions('api', ['getTradeOffer', 'getOfferLog']),
    async cancelOffer() {
      await this.$store.dispatch('chain/cancelOffers', [this.$route.params.id])
    },
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
    async fetchOfferLog() {
      this.offerLog = await this.getOfferLog({
        offerId: this.$route.params.id,
        options: {
          limit: '5',
          order: 'desc',
          page: '1'
        }
      })
    },
    async getOffer() {
      this.offer = await this.getTradeOffer(this.$route.params.id)
    }
  }
}
</script>

<style lang="scss" scoped>
#trade-offer-page {
  .offer-details {
    padding: 24px;
    border-radius: 1rem;
    background-color: var(--bg-alter-2);
  }

  .assets-wrapper {
    background-color: var(--background-color-secondary);
    border-radius: 0.5rem;
    padding: 12px;
  }
  .assets {
    border: none;
    width: 100%;
    height: 340px;
  }
  .message {
    padding: 10px;
    background-color: var(--bg-alter-2);
    border-radius: 0 5px 5px 5px;
    width: fit-content;
  }
}
</style>
