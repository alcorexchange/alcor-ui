<template lang="pug">
#gift-link-page.d-flex.flex-column.gap-16.mt-2
  bread-crumbs
  .fs-36.d-flex.justify-content-center.gap-8
    span Claim Link:
    .color-wax {{ '#' + $route.params.id }}
  .link-details.d-flex.flex-column.gap-16(v-if="link")
    .d-flex.justify-content-center.status.w-100(v-if="!isValid")
      | You are not allowed to claim this link because you did not use a valid key

    .d-flex.justify-content-between
      .d-flex.gap-4
        span Claim Link:
        .color-wax {{ '#' + $route.params.id }}
      .d-flex.gap-4
        span Created:
        .color-wax {{ date }}

    .d-flex.justify-content-between.gap-16
      .assets-wrapper.w-100
        assets-field.assets(v-if="link.assets.length" :assets="link.assets" smallCards="true")

    .d-flex.justify-content-between.gap-4
      span Creator
      .color-wax {{ link.creator }}

    .d-flex.justify-content-between.gap-4
      span Memo
      span {{ link.memo }}

    .w-100
      alcor-button.w-100(access :disabled="!isValid" @click="claim")
        | Claim

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
  data: () => ({ link: null }),
  computed: {
    date() {
      return new Date(+this.link?.created_at_time).toLocaleString()
    },
    isValid() {
      return this.$route.query?.key?.length === 51
    }
  },
  mounted() {
    this.getLink()
  },
  methods: {
    ...mapActions('api', ['getGiftLink']),
    async cancelOffer() {
      await this.$store.dispatch('chain/cancelBuyOffers', [
        [this.offer.buyoffer_id, this.offer.price.amount]
      ])
    },
    async claim() {
      // claimer_signature is not valid
      const r = await this.$store.dispatch('chain/claimGift', {
        link_id: this.link.link_id,
        claimer: this.link.creator,
        claimer_signature: this.link.public_key
      })
    },
    async getLink() {
      this.link = await this.getGiftLink(this.$route.params.id)
    }
  }
}
</script>

<style lang="scss" scoped>
#gift-link-page {
  .link-details {
    padding: 42px 24px;
    width: 850px;
    align-self: center;
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
