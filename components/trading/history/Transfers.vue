<template lang="pug">
#transfer-offers-component
  history-transfer-filters.mt-2(:filters.sync="filters" :sorting.sync="sorting", :collectionOptions="collectionOptions")
  .d-flex.gap-16.justify-content-between(v-if="transferOffers.length")
    .d-flex.flex-column.gap-8.offer-list.mt-3
      .d-flex.flex-column.gap-8.mt-3
        transfer-offer-list-item(
          :previewMode="true"
          v-for="offer in transferOffers"
          :offer="offer"
          @click="preview(offer.transfer_id)"
          :class="{ active: previewOffer && offer.transfer_id === previewOffer.transfer_id }"
        )
    .d-flex.flex-column.gap-16
      transfer-preview(v-if="previewOffer" :offer="previewOffer")

</template>

<script>
import { mapActions, mapState } from 'vuex'
import HistoryTransferFilters from '~/components/HistoryTransferFilters'
import TransferOfferListItem from '~/components/transfers/TransferOfferListItem.vue'
import TransferPreview from '~/components/trading/TransferPreview.vue'

export default {
  components: {
    HistoryTransferFilters,
    TransferOfferListItem,
    TransferPreview
  },
  data: () => ({
    transferOffers: [],
    collectionOptions: null,
    sorting: { val: 'asc' },
    filters: {
      type: 'account',
      collection_name: null,
      after: null,
      before: null,
      show_only_friends_offers: false,
      hide_contracts: false
    }
  }),
  computed: {
    ...mapState(['user']),
    previewOffer() {
      const previewId = this.$route.hash.split('-')[1]
      return (
        previewId &&
        this.transferOffers.find(({ transfer_id }) => transfer_id === previewId)
      )
    },
    refetchProps() {
      ;[
        this.sorting.val,
        this.filters.type,
        this.filters.collection_name,
        this.filters.after,
        this.filters.before,
        this.filters.show_only_friends_offers,
        this.filters.hide_contracts
      ]
      return Date.now()
    }
  },
  watch: {
    refetchProps() {
      this.$cookies.set('global_history_transfers_filters', this.filters)
      this.$cookies.set('global_history_transfers_sorting', this.sorting.val)
      this.getOffers()
    },
    '$route.hash'(v, old) {
      if (v.split('-')[0] !== old.split('-')[0]) this.getOffers()
    }
  },
  mounted() {
    this.filters =
      this.$cookies.get('global_history_transfers_filters') || this.filters
    this.sorting.val = this.$cookies.get('global_history_transfers_sorting')
    this.getOffers()
    this.getAccountCollections()
  },
  methods: {
    ...mapActions('api', ['getTransfers', 'getAccountSpecificStats']),
    preview(id) {
      this.$router.push({ hash: 'transfers' + '-' + id })
    },
    async getAccountCollections() {
      const { collections } = await this.getAccountSpecificStats({ account: this.user.name })
      this.collectionOptions = collections
    },
    async getOffers() {
      const f = this.filters
      const options = {
        state: f.state
      }
      if (f.before) options.before = +f.before + ''
      if (f.after) options.after = +f.after + ''

      if (f.collection_name) options.collection_name = f.collection_name

      if (f.show_indalid_offer) options.show_indalid_offer = 'true'
      if (f.show_only_friends_offers) {
        options.show_only_friends = 'true'
        options.recipient = this.user.name
        options.sender = this.user.name
      }
      if (f.hide_empty_offers) options.hide_empty_offers = 'true'
      if (!f.hide_contracts) options.hide_contracts = 'true'

      this.transferOffers = await this.getTransfers({
        options,
        type: f.show_only_friends_offers ? null : f.type
      })
    }
  }
}
</script>

<style lang="scss">
.offer-list {
  min-width: 370px;
}
</style>
