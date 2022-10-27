<template lang="pug">
#wallet-nfts-layout.d-flex.flex-column.gap-16.mt-2
  nft-header
  .d-flex.align-items-center.gap-24
    input-search(v-model="filters.match")
    alcor-filters(:filters.sync="filters", :options="options")
    alcor-tabs(:links="true" :tabs="tabs")
  nuxt-child
</template>

<script>
import { mapState, mapActions } from 'vuex'
import AlcorTabs from '~/components/AlcorTabs'
import AlcorFilters from '~/components/AlcorFilters'
import InputSearch from '~/components/nft_markets/InputSearch'
import WalletNFTHeader from '~/components/wallet/WalletNFTHeader.vue'

export default {
  name: 'NFTs',
  components: {
    NftHeader: WalletNFTHeader,
    InputSearch,
    AlcorTabs,
    AlcorFilters
  },
  data: () => ({
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
    ...mapState(['network', 'user']),
    refetchProps() { [this.filters.match, this.filters.minPrice, this.filters.maxPrice, this.filters.minMint, this.filters.maxMint, this.filters.sorting, this.filters.collection, this.filters.isDuplicates, this.filters.isBacked]; return Date.now() },
    tabs() {
      return [
        {
          label: 'Inventory',
          route: {
            path: '/wallet/nfts/inventory',
            query: this.filters
          }
        },
        {
          label: 'My Listings',
          route: {
            path: '/wallet/nfts/listings',
            query: this.filters
          }
        },
        {
          label: 'My Auctions',
          route: {
            path: '/wallet/nfts/auctions',
            query: this.filters
          }
        },
        {
          label: 'Sold',
          route: {
            path: '/wallet/nfts/sold',
            query: this.filters
          }
        },
        {
          label: 'Bought',
          route: {
            path: '/wallet/nfts/bought',
            query: this.filters
          }
        },
        {
          label: 'Sets',
          route: {
            path: '/wallet/nfts/sets',
            query: this.filters
          }
        }
      ]
    }
  },
  watch: {
    refetchProps() {
      this.$router.push({ query: this.filters })
    }
  },
  mounted() {
    this.getAccountCollections()
  },
  methods: {
    ...mapActions('api', ['getAccountSpecificStats']),
    async getAccountCollections() {
      const { collections } = await this.getAccountSpecificStats({ account: this.user.name })
      this.options.collection = collections
    },

    async getAssets() {
      this.loading = true
      const data = await this.$store.dispatch('api/getAssets', {
        owner: this.user.name
      })

      Promise.all(
        data.map(({ asset_id }) =>
          this.$store.dispatch('api/getAssetsSales', { asset_id, buyer: this.user.name }))
      ).then(assetsSales => {
        assetsSales.forEach((sales, idx) => {
          data[idx].purchasePrice = sales.sort((a, b) => b.block_time - a.block_time)[0]
        }
        )
        this.inventoryData = data
        this.loading = false
      })
    },

    async getListing() {
      this.loading = true
      const salesData = await this.$store.dispatch('api/getSales', {
        seller: this.user.name,
        state: '0,1,4'
      })
      this.inventoryData = salesData
      this.loading = false
    },

    async getAuctions() {
      this.loading = true
      const openAuctions = await this.$store.dispatch('api/getAuctionData', {
        participant: this.user.name
      })
      const lostAuctions = await this.$store.dispatch('api/getAuctionData', {
        bidder: this.user.name,
        buyer_blacklist: this.user.name,
        state: '3'
      })
      this.inventoryData = [...openAuctions, ...lostAuctions]
      this.loading = false
    },

    async getSold() {
      this.loading = true
      const auctionsData = await this.$store.dispatch('api/getAuctionData', {
        seller: this.user.name,
        state: '3'
      })
      const salesData = await this.$store.dispatch('api/getSales', {
        seller: this.user.name,
        state: '3'
      })
      // this.salesData = openAuctions
      // this.auctionsData = lostAuctions
      this.inventoryData = [...salesData, ...auctionsData]
      this.loading = false
    },

    async getBought() {
      this.loading = true
      const auctionsData = await this.$store.dispatch('api/getAuctionData', {
        buyer: this.user.name,
        state: '3'
      })
      const salesData = await this.$store.dispatch('api/getSales', {
        buyer: this.user.name,
        state: '3'
      })
      // this.salesData = openAuctions
      // this.auctionsData = lostAuctions
      this.inventoryData = [...salesData, ...auctionsData]
      this.loading = false
    },

    async getCollections() {
      this.loading = true
      const data = await this.$store.dispatch('api/getCollectionsForSet')
      this.inventoryData = data.results
      this.loading = false
    },

    async getCollectionData() {
      const data = await this.$store.dispatch('api/getCollectionData', {
        data: 'ss'
      })
      this.collectionData = data
    },

    async getCollectionSets() {
      const data = await this.$store.dispatch('api/getCollectionSets', {
        collection_name: this.selectedCollectionName
      })
      this.collectionSets = data.data
    }
  }
}
</script>
