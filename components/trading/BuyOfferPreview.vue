<template lang="pug">
#offer-preview-component.d-flex.flex-column.gap-16
  .d-flex.justify-content-center.status.w-100(v-if="offer.state === 4")
    | The buy offer is invalid because the recipient does not own all assets anymore
  .d-flex.justify-content-center.status.w-100(v-if="offer.state === 1")
    | {{ offer.seller }} has declined your offer on {{ updateDate }}
  .d-flex.justify-content-center.status.cancelled.w-100(v-if="offer.state === 2")
    | You’ve cancelled the trade offer on {{ updateDate }}
  .d-flex.justify-content-between.align-items-center.w-100
    .d-flex.gap-4.fs-14
      span ID:
      router-link(:to="{ name: `trading-buy-offers-id___${$i18n.locale}`, params: { id: offer.buyoffer_id } }")
        .color-wax {{ '#' + offer.buyoffer_id }}
      span Created:
      span {{ date }}

    .d-flex.gap-4
      alcor-button(v-if="!previewMode" outline @click="cancelOffer")
        i.el-icon-delete
        span Cancel
  .d-flex.gap-8.flex-column.details
    .d-flex.justify-content-between.align-items-center
      .d-flex.align-items-center.justify-content-center.gap-4.w-100.fs-14
        span OFFERED ITEM(S)
        span -
        strong {{ offer.assets.length }}
        span NFT(s)
      .d-flex.align-items-center.justify-content-center.gap-4.w-100.fs-14
        span OFFER DETAILS

    .d-flex.justify-content-between
      assets-field.assets(v-if="offer.assets.length" :assets="offer.assets" smallCards="true")
      .d-flex.flex-column.gap-16.w-50.mt-3
        .d-flex.flex-column.align-items-center.gap-4.account.pointer(@click="goToProfile(offer.buyer)")
          .fs-12 Buyer (you)
          profile-image(:src="'https://wax-mainnet-ah.api.atomichub.io/v1/preview/avatar/' + offer.buyer" :size="24")
          .color-wax {{ offer.buyer }}

        .d-flex.justify-content-center
          i.el-icon-sort.r-45

        .d-flex.flex-column.align-items-center.gap-4.account.pointer(@click="goToProfile(offer.seller)")
          .fs-12 Recipient
          profile-image(:src="'https://wax-mainnet-ah.api.atomichub.io/v1/preview/avatar/' + offer.seller" :size="24")
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
      profile-image(:src="'https://wax-mainnet-ah.api.atomichub.io/v1/preview/avatar/' + offer.buyer" :size="20")
      span {{ offer.buyer }}
    .ml-4.mt-2.message {{ offer.memo }}

</template>

<script>
import AlcorButton from '~/components/AlcorButton'
import AlcorCollapse from '~/components/AlcorCollapse'
import AssetsField from '~/components/nft_markets/AssetsField'
import ProfileImage from '~/components/ProfileImage.vue'

export default {
  components: { AlcorButton, AlcorCollapse, AssetsField, ProfileImage },
  props: ['offer', 'offerLog', 'previewMode'],
  computed: {
    date() {
      return new Date(+this.offer.created_at_time).toLocaleString()
    },
    updateDate() {
      return new Date(+this.offer.updated_at_time).toLocaleString()
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
      await this.$store.dispatch('chain/cancelBuyOffers', [
        [this.offer.buyoffer_id, this.offer.price.amount]
      ])
    }
  }
}
</script>

<style lang="scss">
#offer-preview-component {
  .el-collapse {
    border: none;

    .el-collapse-item__wrap {
      background: var(--background-color-secondary);
      border: none;
    }
    .el-collapse-item__header {
      background: var(--background-color-secondary);
      border: none;
    }
  }
}
</style>

<style lang="scss" scoped>
#offer-preview-component {
  width: 730px;
  padding: 42px 24px;
  border-radius: 1rem;
  background-color: var(--bg-alter-2);
  position: relative;

  .status {
    padding: 5px;
    border-top-left-radius: 17px;
    border-top-right-radius: 17px;
    background: var(--main-action-red);
    position: absolute;
    top: 0;
    left: 0;
    &.cancelled {
      background: var(--main-wax);
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
