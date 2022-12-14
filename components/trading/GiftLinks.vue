<template lang="pug">
#buy-offers-component
  bread-crumbs
  .d-flex.justify-content-between.align-items-center.mt-3
    .fs-24 Gift Links
    .d-flex.gap-8
      alcor-button(outline)
        i.el-icon-time
        span Gift Link History
      alcor-button(access)
        i.el-icon-plus
        span New Gift Link
  .d-flex.align-items-center.gap-24.mt-3
    alcor-tabs(:links="true" :tabs="tabs")
  .d-flex.gap-16.justify-content-between(v-if="giftLinks.length")
    .d-flex.flex-column.gap-8.offer-list.mt-3
      .d-flex.gap-4.fs-10.justify-content-between
        el-checkbox(
          @change="selectAll"
          v-model="isSelectedAll"
        ) Select All Items
        alcor-button(v-if="selected.length" compact outline @click="cancelGifts")
          i.el-icon-delete
          span Cancel Items

      .d-flex.flex-column.gap-8.mt-3.list
        gift-links-list-item(
          v-for="link in giftLinks"
          :link="link"
          @click="preview(link.link_id)"
          :class="{ active: previewLink && link.link_id === previewLink.link_id }"
        )
    .d-flex.flex-column.gap-16
      gift-link-preview(v-if="previewLink" :link="previewLink")

</template>

<script>
import { mapActions } from 'vuex'
import BreadCrumbs from '~/components/elements/BreadCrumbs.vue'
import AlcorButton from '~/components/AlcorButton'
import AlcorTabs from '~/components/AlcorTabs'
import GiftLinksListItem from '~/components/gift-links/GiftLinksListItem.vue'
import GiftLinkPreview from '~/components/trading/GiftLinkPreview'

export default {
  components: {
    BreadCrumbs,
    AlcorButton,
    AlcorTabs,
    GiftLinksListItem,
    GiftLinkPreview
  },
  data: () => ({
    isSelectedAll: false,
    giftLinks: [],
    linkLog: null
  }),
  computed: {
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
    '$route.hash'(v, old) {
      this.fetchOfferLog()
      if (v.split('-')[0] !== old.split('-')[0]) this.getLinks()
      if (v.split('-')[0] !== old.split('-')[0]) this.clearSelected()
    }
  },
  mounted() {
    !this.$route.hash && this.$router.push({ hash: 'active' })
    this.getLinks()
  },
  methods: {
    ...mapActions('modal', ['newTrade']),
    ...mapActions('api', ['getGiftLinks', 'getBuyOfferLog']),
    async cancelGifts() {
      await this.$store.dispatch('chain/cancelGifts', this.selected)
    },
    preview(id) {
      this.$router.push({ hash: 'active' + '-' + id })
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
    async fetchOfferLog() {
      const offerId = this.$route.hash.split('-')[1]

      if (offerId) {
        this.offerLog = await this.getBuyOfferLog({
          offerId,
          options: {
            limit: '5',
            order: 'desc',
            page: '1'
          }
        })
      }
    },
    async getLinks() {
      this.giftLinks = (await this.getGiftLinks()).map((link) => ({
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
