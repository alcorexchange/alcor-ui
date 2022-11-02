<template lang="pug">
#account-id-nfts-layout.d-flex.flex-column.gap-16.mt-2
  .d-flex.align-items-center.gap-24
    input-search(v-model="filters.match")
    alcor-filters(:filters.sync="filters", :options="options")
    alcor-tabs(:links="true" :tabs="tabs")
  main.account-nft-main
    nuxt-child

</template>

<script>
import { mapActions } from 'vuex'
import AlcorTabs from '~/components/AlcorTabs'
import AlcorFilters from '~/components/AlcorFilters'
import InputSearch from '~/components/nft_markets/InputSearch'
import { sortingOptions } from '~/pages/wallet/nfts/sortingOptions'

export default {
  components: { AlcorTabs, AlcorFilters, InputSearch },
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
    refetchProps() { [this.filters.match, this.filters.minPrice, this.filters.maxPrice, this.filters.minMint, this.filters.maxMint, this.filters.sorting, this.filters.collection, this.filters.isDuplicates, this.filters.isBacked]; return Date.now() },
    tabs() {
      return [
        {
          label: 'Inventory',
          route: {
            path: `/account/${this.$route.params.id}/nfts/inventory`,
            query: this.filters
          }
        },
        {
          label: 'Listings',
          route: {
            path: `/account/${this.$route.params.id}/nfts/listings`,
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
      const { collections } = await this.getAccountSpecificStats({ account: this.$route.params.id })
      this.options.collection = collections
    },
    setSortOptions() {
      this.options.sorting = sortingOptions[this.$route.name.split('___')[0]]
    }
  }
}
</script>
