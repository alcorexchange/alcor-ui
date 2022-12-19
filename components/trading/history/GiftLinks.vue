<template lang="pug">
#gift-links-component
  history-gift-links-filter.mt-2(:filters.sync="filters" :sorting.sync="sorting")
  .d-flex.gap-16.justify-content-between(v-if="giftLinks.length")
    .d-flex.flex-column.gap-8.offer-list.mt-3
      .d-flex.flex-column.gap-8.mt-3.list
        gift-links-list-item(
          :previewMode="true"
          v-for="link in giftLinks"
          :link="link"
          @click="preview(link.link_id)"
          :class="{ active: previewLink && link.link_id === previewLink.link_id }"
        )
    .d-flex.flex-column.gap-16
      gift-link-preview(:previewMode="true" v-if="previewLink" :link="previewLink")

</template>

<script>
import { mapActions } from 'vuex'
import BreadCrumbs from '~/components/elements/BreadCrumbs.vue'
import AlcorButton from '~/components/AlcorButton'
import AlcorTabs from '~/components/AlcorTabs'
import HistoryGiftLinksFilter from '~/components/HistoryGiftLinksFilter'
import GiftLinksListItem from '~/components/gift-links/GiftLinksListItem.vue'
import GiftLinkPreview from '~/components/trading/GiftLinkPreview'

export default {
  components: {
    BreadCrumbs,
    AlcorButton,
    AlcorTabs,
    HistoryGiftLinksFilter,
    GiftLinksListItem,
    GiftLinkPreview
  },
  data: () => ({
    giftLinks: [],
    linkLog: null,
    sorting: { val: 'created_asc' },
    filters: {
      startDate: null,
      endDate: null,
      type: '0,4'
    }
  }),
  computed: {
    refetchProps() {
      ;[
        this.sorting.val,
        this.filters.startDate,
        this.filters.endDate,
        this.filters.type
      ]
      return Date.now()
    },
    previewLink() {
      const previewId = this.$route.hash.split('-')[1]
      return (
        previewId && this.giftLinks.find(({ link_id }) => link_id === previewId)
      )
    },
    selected() {
      return this.giftLinks
        .filter(({ isSelected }) => isSelected)
        .map(({ link_id }) => ({ link_id }))
    },
    tabs() {
      return [
        {
          label: `Active Gift Links (${this.giftLinks.length})`,
          route: {
            path: '/trading/buy-offers',
            hash: `sent${
              this.previewLink ? '-' + this.previewLink.link_id : ''
            }`
          }
        }
      ]
    }
  },
  watch: {
    selected(selected) {
      this.isSelectedAll = selected.length === this.giftLinks.length
    },
    refetchProps() {
      this.$cookies.set('global_history_gift_links_filters', this.filters)
      this.$cookies.set('global_history_gift_links_sotring', this.sorting.val)
      this.getLinks()
    }
  },
  mounted() {
    !this.$route.hash && this.$router.push({ hash: 'active' })
    this.filters =
      this.$cookies.get('global_history_gift_links_filters') || this.filters
    this.sorting.val = this.$cookies.get('global_history_gift_links_sotring')
    this.getLinks()
  },
  methods: {
    ...mapActions('modal', ['newTrade']),
    ...mapActions('api', ['getGiftLinks']),
    async cancelGifts() {
      await this.$store.dispatch('chain/cancelGifts', this.selected)
    },
    preview(id) {
      this.$router.push({ hash: 'giftlinks' + '-' + id })
    },
    openNewTradeModal() {
      this.newTrade({ transferAssets: [this.data] })
    },
    selectAll(isSelect) {
      isSelect
        ? this.giftLinks.forEach((o) => (o.isSelected = true))
        : this.clearSelected()
    },
    clearSelected() {
      this.giftLinks.forEach((o) => (o.isSelected = false))
    },
    async getLinks() {
      this.giftLinks = (
        await this.getGiftLinks({
          order: this.sorting.val.split('_')[1],
          sort: this.sorting.val.split('_')[0],
          state: this.filters.type,
          after: new Date(this.filters.startDate).getTime(),
          before: new Date(this.filters.endDate).getTime()
        })
      ).map((link) => ({
        ...link,
        isSelected: false
      }))
    }
  }
}
</script>

<style lang="scss">
.offer-list {
  min-width: 370px;
}
.list {
  max-height: 600px;
  overflow: scroll;

  -ms-overflow-style: none;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
}
</style>
