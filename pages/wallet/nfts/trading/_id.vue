<template lang="pug">
.nft-trading-id-page
  WalletNFTHeader
  .fs-18.d-flex.align-items-center.gap-6.mt-4
    span You are now trading with:
    span.user-name.fs-12.p-2.d-flex.align-items-center.gap-8
      span {{ $route.params.id }}
      copy.pointer(@click="copyUserName" width="16" height="16" :color="color")
  .d-flex.gap-40.mt-4
    .d-flex.align-items-center.gap-6.w-50
      profile-image(:src="myImgSrc" :size="42")
      .fs-20 {{ user.name }}
    .d-flex.align-items-center.gap-6.w-50
      profile-image(:src="hisImgSrc" :size="42")
      .fs-20 {{ $route.params.id }}
  .d-flex.gap-40.mt-4
    assets-field.w-50(:assets="myOfferAssets" @removeAsset="asset => toggleSelected(0, asset)")
    assets-field.w-50(:assets="hisOfferAssets" @removeAsset="asset => toggleSelected(1, asset)")

  .d-flex.align-items-center.justify-content-between.gap-28.mt-5
    .d-flex.align-items-center.gap-28.w-100
      input-search(v-model="filters.match")
      alcor-filters(:filters.sync="filters", :options="options")
      alcor-tab.pointer(v-for="(label, idx) in ['Your inventory', 'Their inventory']" :class="{ active: activeTab === idx }" @click="activeTab = idx") {{ label }}
    alcor-button(access, @click="send" :disabled="!myOfferAssets.length || !hisOfferAssets.length")
      i.el-icon-sort.rot-90
      span Send Trade Offer

  .d-flex.justify-content-center.flex-wrap.gap-30.mt-5
    vue-skeleton-loader(
      v-if="loading"
      :width='170',
      :height='233',
      animation='wave',
      wave-color='rgba(150, 150, 150, 0.1)',
      :rounded='true'
    )
    preview-card.pointer(
      v-else
      v-for="item in availableAssets"
      :key="item.asset_id"
      :data="item"
      @click="toggleSelected(activeTab, item)"
      :class="{ 'active-border': offerAssets.find(({ asset_id }) => asset_id === item.asset_id), disable: offerAssets && offerAssets.length > 0 && item.collection.collection_name !== offerAssets[0].collection.collection_name }"
      :small="true"
    )

</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import VueSkeletonLoader from 'skeleton-loader-vue'
import WalletNFTHeader from '~/components/wallet/WalletNFTHeader.vue'
import AssetsField from '~/components/nft_markets/AssetsField'
import ProfileImage from '~/components/ProfileImage.vue'
import AlcorTab from '~/components/AlcorTab.vue'
import AlcorButton from '~/components/AlcorButton'
import AlcorFilters from '~/components/AlcorFilters'
import PreviewCard from '~/components/cards/PreviewCard'
import InputSearch from '~/components/nft_markets/InputSearch'
import Copy from '~/components/svg-icons/Copy.vue'

export default {
  components: { WalletNFTHeader, Copy, AssetsField, ProfileImage, AlcorTab, AlcorButton, PreviewCard, VueSkeletonLoader, InputSearch, AlcorFilters },
  data: () => ({
    activeTab: 0,
    myOfferAssets: [],
    hisOfferAssets: [],
    availableAssets: [],
    hisImgSrc: null,
    myImgSrc: null,
    debounce: null,
    loading: false,
    search: '',
    filters: {
      match: '',
      sorting: null,
      collection: null,
      minMint: null,
      maxMint: null,
      minPrice: null,
      maxPrice: null,
      isDuplicates: null,
      isBacked: null
    },
    options: {
      collection: null,
      sorting: [
        { value: 'transferred', label: 'Transferred (Newest)' },
        { value: 'transferred-desc', label: 'Transferred (Oldest)' },
        { value: 'created-asc', label: 'Created (Newest)' },
        { value: 'created-desc', label: 'Created (Oldest)' },
        { value: 'minted-asc', label: 'Mint (Highest)' },
        { value: 'minted-desc', label: 'Mint (Lowest)' },
        { value: 'name-asc', label: 'Alphabetical (A-Z)' }
      ]
    }
  }),
  computed: {
    ...mapGetters(['user']),
    refetchProps() { [this.activeTab, this.filters.match, this.filters.minPrice, this.filters.maxPrice, this.filters.minMint, this.filters.maxMint, this.filters.sorting, this.filters.collection, this.filters.isDuplicates, this.filters.isBacked]; return Date.now() },
    offerAssets() { return [...this.myOfferAssets, ...this.hisOfferAssets] },
    color() {
      return this.$colorMode.preference !== 'dark' ? '#303133' : '#BDBDBD'
    }
  },
  watch: {
    refetchProps() {
      this.$router.push({ query: this.filters })
    },
    activeTab() {
      this.fetchAssets()
    },
    '$route.query'() {
      this.fetchAssets()
    }
  },
  mounted() {
    this.myOfferAssets = []
    this.hisOfferAssets = []
    this.getTradersImage()
    this.fetchAssets()
  },
  methods: {
    ...mapActions('social', ['getPhotoHash']),
    ...mapActions('api', ['getAssets']),
    ...mapActions('chain', ['sendTradeOffer']),
    send() {
      this.sendTradeOffer({
        recipient: this.$route.params.id,
        sender_asset_ids: this.myOfferAssets.map(({ asset_id }) => asset_id),
        recipient_asset_ids: this.hisOfferAssets.map(({ asset_id }) => asset_id)
      })
    },
    async getTradersImage() {
      const myHash = await this.getPhotoHash(this.user.name)
      const hisHash = await this.getPhotoHash(this.$route.params.id)
      this.myImgSrc = myHash && `https://gateway.pinata.cloud/ipfs/${myHash}`
      this.hisImgSrc = hisHash && `https://gateway.pinata.cloud/ipfs/${hisHash}`
    },
    copyUserName() {
      navigator.clipboard.writeText(this.$route.params.id)
      this.$notify({
        title: 'Clipboard',
        message: 'Account name copyed to Clipboard',
        type: 'info'
      })
    },
    fetchAssets() {
      clearTimeout(this.debounce)
      this.debounce = setTimeout(async () => {
        this.loading = true
        const assets = await this.getAssets({
          owner: this.activeTab ? this.$route.params.id : this.user.name,
          collection_name: this.$route.query?.collection,
          sort: this.$route.query?.sorting?.split('-')[0] || null,
          order: this.$route.query?.sorting?.split('-')[1] || null,
          match: this.$route.query?.match,
          max_template_mint: this.$route.query?.maxMint,
          min_template_mint: this.$route.query?.minMint,
          has_backed_tokens: !!this.$route.query?.isBacked,
          only_duplicate_templates: !!this.$route.query?.isDuplicates
        })


        this.availableAssets = assets.reduce((res, asset) => {
          [this.offerAssets].find(({ asset_id: offerID }) => offerID === asset.asset_id) ? res[0].push(asset) : res[1].push(asset)
          return res
        }, [[], []]).flat()

        this.loading = false
      }, 600)
    },

    toggleSelected(idx, asset) {
      const offers = idx ? 'hisOfferAssets' : 'myOfferAssets'
      this[offers].find(({ asset_id }) => asset_id === asset.asset_id)
        ? this[offers] = this[offers].filter(({ asset_id }) => asset_id !== asset.asset_id)
        : this[offers].push(asset)
    }
  }
}
</script>

<style scoped lang="scss">
.user-name {
  border-radius: 2px;

  background: var(--card-number);
}
</style>
