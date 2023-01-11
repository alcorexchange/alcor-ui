<template lang="pug">
.j-container
  nuxt-link(:to="localePath('nft-market', $i18n.locale)" :exact='true')
    //a#return-btn Return
    #return-btn Return
  h4 Marketplace
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
import { sortingOptions } from '~/pages/wallet/nfts/sortingOptions'

export default {
  components: {
    AlcorFilters,
    AlcorTabs,
    InputSearch
  },

  data() {
    return {
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
    }
  },
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
          label: 'Sales',
          route: {
            path: '/nft-market/nft-marketplace/sales',
            query: this.filters
          }
        },
        {
          label: 'Auctions',
          route: {
            path: '/nft-market/nft-marketplace/auctions',
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
    '$route.name'() {
      this.setSortOptions()
    }
  },

  mounted() {
    this.getCollectionData()
    this.setSortOptions()
  },

  methods: {
    ...mapActions('api', ['getAccountSpecificStats']),
    setSortOptions() {
      this.options.sorting = sortingOptions[this.$route.name.split('___')[0]]
    },
    async getCollectionData() {
      const data = await this.$store.dispatch('api/getCollections')
      this.options.collection = data.map((col) => ({ collection: col }))
    }
  },

  head() {
    return {
      title: `Alcor NFT Market | Trustless NFT market on ${this.network.name.toUpperCase()} chain`,

      meta: [
        {
          hid: 'description',
          name: 'description',
          content: 'Atomic, no fee, NFT marketplace.'
        }
      ]
    }
  }
}
</script>

<style lang="scss" scoped>
#return-btn::before {
  content: '←';
}

#return-btn {
  font-weight: 500;
  font-size: 14px;
  color: #9f979a !important;
  cursor: pointer;
  display: flex;
  gap: 5px;
  margin-top: 12px;
}

h4 {
  margin: 16px 0;
}
</style>
