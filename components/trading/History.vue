<template lang="pug">
#buy-offers-component
  bread-crumbs
  .d-flex.justify-content-between.align-items-center.mt-3
    .fs-24 History
  .d-flex.align-items-center.gap-24.mt-3
    alcor-tabs(:links="true" :tabs="tabs")
  component(:is='$route.hash.split("-")[0].replace("#", "")')
</template>

<script>
import BreadCrumbs from '~/components/elements/BreadCrumbs.vue'
import AlcorTabs from '~/components/AlcorTabs'
import Transfers from '~/components/trading/history/Transfers.vue'
import BuyOffers from '~/components/trading/history/BuyOffers.vue'
import TradeOffers from '~/components/trading/history/TradeOffers.vue'
import GiftLinks from '~/components/trading/history/GiftLinks.vue'

export default {
  components: {
    BreadCrumbs,
    AlcorTabs,
    Transfers,
    Tradeoffers: TradeOffers,
    Buyoffers: BuyOffers,
    Giftlinks: GiftLinks
  },
  computed: {
    tabs() {
      return [
        {
          label: 'Transfers',
          route: {
            path: '/trading/history',
            hash: 'transfers'
          }
        },
        {
          label: 'Trade Offers',
          route: {
            path: '/trading/history',
            hash: `tradeoffers${
              this.$route.hash.split('-')[1]
                ? '-' + this.$route.hash.split('-')[1]
                : ''
            }`
          }
        },
        {
          label: 'Buy Offers',
          route: {
            path: '/trading/history',
            hash: `buyoffers${
              this.$route.hash.split('-')[1]
                ? '-' + this.$route.hash.split('-')[1]
                : ''
            }`
          }
        },
        {
          label: 'Gift Links',
          route: {
            path: '/trading/history',
            hash: `giftlinks${
              this.$route.hash.split('-')[1]
                ? '-' + this.$route.hash.split('-')[1]
                : ''
            }`
          }
        }
      ]
    }
  },
  mounted() {
    !this.$route.hash && this.$router.push({ hash: 'transfers' })
  }
}
</script>
