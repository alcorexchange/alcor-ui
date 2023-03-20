<template lang="pug">
#wallet-nfts-layout.d-flex.flex-column.gap-16.mt-2
  nft-header
  .d-flex.align-items-center.gap-24.flex-wrap
    input-search(v-model="filters.match")
    alcor-filters(:filters.sync="filters", :options="options" :disabled="$route.name.split('___')[0] === 'wallet-nfts-sets'")
    alcor-tabs(:links="true" :tabs="tabs")
  nuxt-child
</template>

<script>
import { mapState, mapActions } from 'vuex'
import AlcorTabs from '~/components/AlcorTabs'
import AlcorFilters from '~/components/AlcorFilters'
import InputSearch from '~/components/nft_markets/InputSearch'
import WalletNFTHeader from '~/components/wallet/WalletNFTHeader.vue'
import { sortingOptions } from '~/pages/wallet/nfts/sortingOptions'

export default {
  name: 'NFTs',
  components: {
    NftHeader: WalletNFTHeader,
    InputSearch,
    AlcorTabs,
    AlcorFilters
  },
  // fetch({ route, redirect }) {
  //   if (route.path == '/wallet/nfts') redirect('/wallet/nfts/inventory?match&sorting&collection&minMint&maxMint&minPrice&maxPrice&isDuplicates&isBacked')
  // },
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
      sorting: null
    }
  }),
  computed: {
    ...mapState(['network', 'user']),
    refetchProps() {
      ;[
        this.filters.match,
        this.filters.minPrice,
        this.filters.maxPrice,
        this.filters.minMint,
        this.filters.maxMint,
        this.filters.sorting,
        this.filters.collection,
        this.filters.isDuplicates,
        this.filters.isBacked
      ]
      return Date.now()
    },
    tabs() {
      return [
        {
          label: 'Inventory',
          route: '/wallet/nfts'
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
    },
    '$route.name'(route) {
      this.filters.sorting = null
      this.setSortOptions()
    }
  },
  mounted() {
    this.getAccountCollections()
    this.setSortOptions()
  },
  methods: {
    ...mapActions('api', ['getAccountSpecificStats']),
    async getAccountCollections() {
      const { collections } = await this.getAccountSpecificStats({
        account: this.user.name
      })
      this.options.collection = collections
    },
    setSortOptions() {
      this.options.sorting = sortingOptions[this.$route.name.split('___')[0]]
    }
  }
}
</script>
