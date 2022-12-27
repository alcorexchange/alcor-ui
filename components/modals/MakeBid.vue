<template lang="pug">
.make-offer-component
  .title.fs-18.fw-bold.d-flex.align-items-center.gap-10.mb-3
    i.el-icon-sell
    span Bid on Auction
  .d-flex.gap-32
    .d-flex.gap-32
      assets-field(:assets="context.assets" :style="{ width: '240px'}")
      .d-flex.flex-column.justify-content-between(:style="{ width: '440px'}")
        .d-flex.flex-column.gap-8.w-100
          .fs-18 Summary
          .d-flex
            .w-50 Auction ID
            .w-50 {{ '#' + context.auction_id }}
          .d-flex
            .w-50 Collection
            .w-50 {{ context.collection.collection_name }}
          .d-flex
            .w-50 Bids
            .w-50 {{ context.bids.length }}
          .d-flex
            .w-50 Ends in
            .w-50 {{ timeToEnd }}
          .d-flex
            .w-50 Top Bidder
            account-link(v-if="topBidder" :accountName="topBidder.account")
            span(v-else) No Bid
          .d-flex(v-if="topBidder")
            .w-50 Highest Bid
            .w-50.d-flex.gap-4
              .color-green {{ waxFormat(topBidder.amount) }} WAX
              span (${{ $systemToUSD(waxFormat(topBidder.amount)) }})
          .status.mt-2(v-if='isTopBider') You are currently the top bidder of this auction
          .status.error.mt-2(v-else-if="!isValidAmount") You need to increase your bid
        .d-flex.flex-column.gap-16
          el-input.dark(v-model='waxAmount', size='small', placeholder='Amount of WAX')
            template(slot="append") WAX
          span.text-center(v-if="waxAmount") {{ waxAmount }} WAX equals ${{ $systemToUSD(waxAmount) }}
          alcor-button(access :disabled="!waxAmount || !isValidAmount || isTopBider" @click="placeBid") Place Bid

</template>

<script>
import { mapState, mapActions } from 'vuex'
import VueSkeletonLoader from 'skeleton-loader-vue'
import Chart from '~/components/nft_markets/Chart'
import AssetsField from '~/components/nft_markets/AssetsField'
import PreviewCard from '~/components/cards/PreviewCard'
import AlcorButton from '~/components/AlcorButton'
import AccountLink from '~/components/AccountLink'

export default {
  components: {
    AssetsField,
    VueSkeletonLoader,
    Chart,
    AlcorButton,
    PreviewCard,
    AccountLink
  },
  data: () => ({
    waxAmount: 0
  }),
  computed: {
    ...mapState('modal', ['context']),
    ...mapState(['user']),
    isValidAmount() {
      return (
        !this.context.bids.length ||
        this.waxAmount >=
          this.waxFormat(Math.floor(+this.topBidder?.amount * 1.11))
      )
    },
    isTopBider() {
      return this.user.name === this.topBidder?.account
    },
    timeToEnd() {
      const diff = this.context.end_time - Date.now()
      const time = Math.round(diff / (1000 * 60 * 60))
      const h = time % 24
      const d = Math.floor(time / 24)
      if (h < 0 || d < 0) return '0h'
      return `${d}d ${h}h`
    },
    topBidder() {
      return this.context.bids.reduce(
        (prev, curr) => (curr.amount > prev.amount ? curr : prev),
        this.context.bids[0]
      )
    }
  },
  watch: {
    context() {
      this.setAmount()
    }
  },
  mounted() {
    this.setAmount()
  },
  methods: {
    ...mapActions('chain', ['makeBid']),
    setAmount() {
      console.log('sssss')
      this.waxAmount =
        this.waxFormat(Math.floor(+this.topBidder?.amount * 1.11)) ||
        this.waxFormat(this.context.price.amount) ||
        0
    },
    placeBid() {
      this.makeBid({
        waxAmount: this.waxAmount,
        auction_id: this.context.auction_id
      })
    },
    waxFormat(v) {
      return v / 100000000
    }
  }
}
</script>

<style lang="scss" scoped>
.status {
  text-align: center;
  border-radius: 10px;
  padding: 10px;
  background: var(--main-action-green);
  color: var(--background-color-base);
  font-size: 12px;

  &.error {
    background: var(--main-action-red);
  }
}
</style>
