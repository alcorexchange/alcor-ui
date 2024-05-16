<template lang="pug">
#trade-offer-page.d-flex.flex-column.gap-16.mt-2
  bread-crumbs
  .fs-36.d-flex.gap-8
    span Buy Offer:
    .color-wax {{ '#' + $route.params.id }}
  .offer-details.d-flex.flex-column.gap-16(v-if="offer")
    .d-flex.justify-content-center.status.w-100(v-if="offer.state === 4")
      | The buy offer is invalid because the recipient does not own all assets anymore

    .d-flex.justify-content-between
      .d-flex.gap-4
        span Buy Offer ID:
        .color-wax {{ '#' + $route.params.id }}
      .d-flex.gap-4
        span Created:
        .color-wax {{ date }}
    .d-flex.justify-content-between
      span
      alcor-button(outline @click="cancelOffer")
        i.el-icon-delete
        span Cancel

    .d-flex.justify-content-between.gap-16
      .assets-wrapper.w-50
        .text-center.mt-2 OFFERED ITEMS (1)
        assets-field.assets(v-if="offer.assets.length" :assets="offer.assets" smallCards="true")
      .assets-wrapper.d-flex.flex-column.gap-16.w-50.mt-3
        .d-flex.flex-column.align-items-center.gap-4.account.pointer(@click="goToProfile(offer.buyer)")
          .fs-12 Buyer (you)
          profile-image(
            :src="`https://profile.api.atomichub.io/v1/profiles/chain/wax-mainnet/account/${offer.buyer}/avatar`"
            :size="24"
          )
          .color-wax {{ offer.buyer }}

        .d-flex.justify-content-center
          i.el-icon-sort.r-45

        .d-flex.flex-column.align-items-center.gap-4.account.pointer(@click="goToProfile(offer.seller)")
          .fs-12 Recipient
          profile-image(
            :src="`https://profile.api.atomichub.io/v1/profiles/chain/wax-mainnet/account/${offer.seller}/avatar`"
            :size="24"
          )
          .color-wax {{ offer.seller }}

        ul.d-flex.flex-column.w-100.fs-12
          li.d-flex.justify-content-between.p-1.list-item
            span Buyer offered
            .color-action {{ (+offer.price.amount / 100000000) + ' WAX' }} ({{ $systemToUSD((+offer.price.amount / 100000000)) }}$)
          li.d-flex.justify-content-between.p-1.list-item
            span Collection fee ({{ offer.collection.market_fee * 100 }})
            .color-danger -{{ ((+offer.price.amount / 100000000) * offer.collection.market_fee).toFixed(4) }} WAX
          li.d-flex.justify-content-between.p-1.list-item
            span Alcor fee (1%)
            .color-danger -{{ ((+offer.price.amount / 100000000) * 0.01).toFixed(4) }} WAX
          li.d-flex.justify-content-between.p-1.list-item
            span Tokenomics Fee (2%)
            .color-danger -{{ ((+offer.price.amount / 100000000) * 0.02).toFixed(4) }} WAX
          li.d-flex.justify-content-between.p-1.list-item
            span Recipient receives
            .color-action {{ ((+offer.price.amount / 100000000) - ((+offer.price.amount / 100000000) * 0.02) - ((+offer.price.amount / 100000000) * 0.01) - ((+offer.price.amount / 100000000) * offer.collection.market_fee)).toFixed(3) }} WAX


    alcor-collapse(v-if="offer.memo")
      .d-flex.align-items-center.gap-8(slot="title")
        i.el-icon-chat-square
        .fs-14 Message
      .d-flex.align-items-center.gap-4.fs-12
        profile-image(
          :src="`https://profile.api.atomichub.io/v1/profiles/chain/wax-mainnet/account/${offer.buyer}/avatar`"
          :size="24"
        )
        span {{ offer.buyer }}
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
    ...mapActions('api', ['getBuyOffer', 'getBuyOfferLog']),
    async cancelOffer() {
      await this.$store.dispatch('chain/cancelBuyOffers', [
        [this.offer.buyoffer_id, this.offer.price.amount]
      ])
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
      this.offerLog = await this.getBuyOfferLog({
        offerId: this.$route.params.id,
        options: {
          limit: '5',
          order: 'desc',
          page: '1'
        }
      })
    },
    async getOffer() {
      this.offer = await this.getBuyOffer(this.$route.params.id)
    }
  }
}
</script>

<style lang="scss" scoped>
#trade-offer-page {
  .offer-details {
    padding: 42px 24px;
    border-radius: 1rem;
    background-color: var(--bg-alter-2);

    position: relative;

    .status {
      padding: 5px;
      border-top-left-radius: 20px;
      border-top-right-radius: 20px;
      background: var(--main-action-red);
      position: absolute;
      top: 0;
      left: 0;
    }
  }
  .account {
    width: 100%;
    padding: 10px;
    border-radius: 0.5rem;
    background-color: var(--bg-alter-2);
  }

  .list-item {
    border-radius: 0.5rem;

    &:nth-of-type(2n-1) {
      background-color: var(--bg-alter-2);
    }
  }

  .r-45 {
    transform: rotate(90deg);
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
