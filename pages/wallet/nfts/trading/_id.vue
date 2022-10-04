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
      .w-25
        el-input(
          v-model='search',
          prefix-icon='el-icon-search'
          :placeholder='$t("Search name or address")',
          clearable
        )
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
import PreviewCard from '~/components/cards/PreviewCard'
import Copy from '~/components/svg-icons/Copy.vue'

export default {
  components: { WalletNFTHeader, Copy, AssetsField, ProfileImage, AlcorTab, AlcorButton, PreviewCard, VueSkeletonLoader },
  data: () => ({
    activeTab: 0,
    myOfferAssets: [],
    hisOfferAssets: [],
    availableAssets: [],
    hisImgSrc: null,
    myImgSrc: null,
    debounce: null,
    loading: false,
    search: ''
  }),
  computed: {
    ...mapGetters(['user']),
    refetchProps() { [this.activeTab, this.search]; return Date.now() },
    offerAssets() { return [...this.myOfferAssets, ...this.hisOfferAssets] },
    color() {
      return this.$colorMode.preference !== 'dark' ? '#303133' : '#BDBDBD'
    }
  },
  watch: {
    refetchProps() {
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
          search: this.search
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
