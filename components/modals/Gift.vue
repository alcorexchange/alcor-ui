<template lang="pug">
.transfer-component
  .title.fs-18.fw-bold.d-flex.align-items-center.gap-10.mb-3
    i.el-icon-present
    span Create New Gift Link
  .d-flex.flex-column.gap-32
    .d-flex.flex-column.gap-16
      span.fs-18.disable Memo
      el-input.dark(
        size='small',
        v-model='memo',
        placeholder='Transfer Memo',
      )
    .d-flex.justify-content-center
      assets-field(:assets="giftAssets" @removeAsset="toggleSelected")

    .d-flex.flex-column.gap-16
      el-input(
        size='small',
        v-model='search',
        prefix-icon='el-icon-search'
        :placeholder='$t("Search NFTs")',
        clearable
      )
      el-select(v-model='selectedCollection')
        el-option(
          label='All',
          :value='null'
        )
        el-option(
          v-for='option in availableCollections',
          :key='option.collection_name',
          :label='option.collection_name',
          :value='option.collection_name'
        )
          .d-flex.gap-10.align-items-center
            img.icon(:src="`https://resizer.atomichub.io/images/v1/preview?ipfs=${option.img}&size=370`")
            span {{ option.collection_name }} ({{ option.assets }})
      .d-flex.gap-10
        el-input.dark(
          size='small',
          v-model='minMint',
          :placeholder='$t("Min Mint")',
        )
        el-input.dark(
          size='small',
          v-model='maxMint',
          :placeholder='$t("Max Mint")',
        )

      .d-flex.gap-16.justify-content-center
        el-checkbox(
          v-model="isDuplicates"
        ) {{ $t('Only Duplicates') }}
        el-checkbox(
          v-model="isBacked"
        ) {{ $t('Only backed NFTs') }}
  .assets-list
    .available-assets
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
        :ownerName="item.owner"
        :key="item.asset_id"
        :data="item"
        @click="toggleSelected(item)"
        :class="{ 'active-border': giftAssets.find(({ asset_id }) => asset_id === item.asset_id) }"
        :small="true"
      )
    .gradient
  alcor-button.w-100(access, :disabled="!isReady" @click="createGiftLink")
    i.el-icon-present
    span Generate Gift Link
</template>

<script>
import { mapState, mapActions } from 'vuex'
import VueSkeletonLoader from 'skeleton-loader-vue'
import PreviewCard from '~/components/cards/PreviewCard'
import AssetsField from '~/components/nft_markets/AssetsField'
import AlcorButton from '~/components/AlcorButton'

export default {
  components: { AssetsField, VueSkeletonLoader, PreviewCard, AlcorButton },
  data: () => ({
    loading: false,
    reciever: '',
    memo: '',
    search: '',
    giftAssets: [],
    availableAssets: [],
    availableCollections: [],
    selectedCollection: null,
    minMint: null,
    maxMint: null,
    isBacked: false,
    isDuplicates: false
  }),
  computed: {
    ...mapState('modal', ['context']),
    ...mapState(['user']),
    isReady() { return this.giftAssets.length },
    refetchProps() { [this.selectedCollection, this.isDuplicates, this.isBacked, this.minMint, this.maxMint, this.search]; return Date.now() }
  },
  watch: {
    refetchProps() {
      this.fetchAssets()
    },
    context() {
      this.giftAssets = []
      this.context.giftAssets && this.giftAssets.push(...this.context.giftAssets)
    }
  },
  mounted() {
    this.setOptions()
    this.fetchAssets()
    this.getAccountCollection()
  },
  methods: {
    ...mapActions('api', ['getAssets', 'getAccountSpecificStats']),
    ...mapActions('chain', ['generateGiftLink']),
    toggleSelected(asset) {
      this.giftAssets.find(({ asset_id }) => asset_id === asset.asset_id)
        ? this.giftAssets = this.giftAssets.filter(({ asset_id }) => asset_id !== asset.asset_id)
        : this.giftAssets.push(asset)
    },
    setOptions() {
      this.reciever = this.context.reciever
      this.context.giftAssets && this.giftAssets.push(...this.context.giftAssets)
    },
    createGiftLink() {
      this.generateGiftLink({ memo: this.memo, asset_ids: this.giftAssets.map(({ asset_id }) => asset_id) })
    },
    async getAccountCollection() {
      const { collections } = await this.getAccountSpecificStats({ account: this.user.name })
      this.availableCollections = collections.map(({ assets, collection }) => ({ ...collection, assets }))
    },
    fetchAssets() {
      clearTimeout(this.debounce)
      this.debounce = setTimeout(async () => {
        this.loading = true
        const assets = await this.getAssets({
          owner: this.user.name,
          collection_name: this.selectedCollection || null,
          search: this.search,
          max_template_mint: this.maxMint,
          min_template_mint: this.minMint,
          has_backed_tokens: !!this.isBacked,
          only_duplicate_templates: !!this.isDuplicates
        })

        this.availableAssets = assets.reduce((res, asset) => {
          this.giftAssets.find(({ asset_id: offerID }) => offerID === asset.asset_id) ? res[0].push(asset) : res[1].push(asset)
          return res
        }, [[], []]).flat()

        this.loading = false
      }, 600)
    }
  }
}
</script>

<style lang="scss">
.transfer-component .el-input--small,
.transfer-component .el-select {
  .el-input__inner {
    background-color: var(--bg-alter-2);
  }

  &.dark .el-input__inner {
    background-color: var(--btn-active);
    border: 1px solid var(--btn-active);
  }
}

.transfer-component .assets-list {
  position: relative;

  .gradient {
    background: linear-gradient(180deg, rgba(33, 33, 33, 0) 0%, var(--dialog-background) 77.95%);
    position: absolute;
    width: 100%;
    height: 100px;
    bottom: 0;
  }

}

.transfer-component .available-assets {
  padding: 20px 20px 80px 20px;
  height: 650px;
  width: 850px;
  gap: 32px;
  display: flex;
  flex-wrap: wrap;
  overflow: scroll;

  -ms-overflow-style: none;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
}
</style>
