<template lang="pug">
.j-container
  div
    nuxt-link(:to='"/nft-market"', :exact='true')
      a#return-btn Return
    h4 Explorer
  .header
    InputSearch(v-model="search")
    MarketTabs(:tabs="tabs" v-model="tab" @change="handleTab")
  .grid-container(v-if='loading')
    vue-skeleton-loader(
      :width='220',
      :height='380',
      animation='wave',
      wave-color='rgba(150, 150, 150, 0.1)',
      :rounded='true',
      v-for='item in 40',
      :key='item'
    )
  .grid-container(v-else)
    .d-flex.justify-content-center(
      v-if='tab === "all" || tab === "assets"',
      v-for='(item, index) in assetsData',
      :key='"assets-" + index'
    )
      NormalCard(v-if='item', :data='item', :price='getPrice', mode='assets')
    .d-flex.justify-content-center(
      v-if='tab === "all" || tab === "templates"',
      v-for='(item, index) in templatesData',
      :key='"templates-" + index'
    )
      NormalCard(
        v-if='item',
        :data='item',
        :price='getPrice',
        mode='templates'
      )
    .d-flex.justify-content-center(
      v-if='tab === "all" || tab === "schemas"',
      v-for='(item, index) in schemasData',
      :key='"schemas-" + index'
    )
      NormalCard(v-if='item', :data='item', :price='getPrice', mode='schemas')
</template>

<script>
// import Vue from 'vue'
import { mapState } from 'vuex'
import VueSkeletonLoader from 'skeleton-loader-vue'
import NormalCard from '~/components/nft_markets/NormalCard'
import ExplorerTab from '~/components/nft_markets/ExplorerTab'
import MarketTabs from '~/components/nft_markets/MarketTabs'
import InputSearch from '~/components/nft_markets/InputSearch'
import searchImg from '~/assets/images/search.svg'
import filterImg from '~/assets/images/filter.svg'
import downImg from '~/assets/images/down.svg'

export default {
  components: {
    NormalCard,
    ExplorerTab,
    MarketTabs,
    InputSearch,
    VueSkeletonLoader,
  },

  data() {
    return {
      search: '',
      sellOrders: [],
      tabIndex: 0,
      loading: true,
      assetsData: [],
      tab: 'all',
      tabs: { all: 'All', assets: 'Assets', templates: 'Templates', schemas: 'Schemas', accounts: 'Accounts' },
      templatesData: [],
      accountsData: [],
      collectionData: [],
      schemasData: [],
      currentCollectionName: '',
      limit: 40,
      data: {
        searchIcon: searchImg,
        filterIcon: filterImg,
        downIcon: downImg,
      },
    }
  },

  watch: {
    tab() {
      this.currentCollectionName = ''
      this.search = ''
      this.getData()
    },
    search() {
      this.getData()
    },
  },

  computed: {
    ...mapState(['network']),
    ...mapState('wallet', ['systemPrice']),

    getPrice() {
      let price = this.systemPrice
      return price
    },
  },

  mounted() {
    this.getData()
    this.getCollectionData()
  },

  methods: {
    handleTab(value) {
      this.tab = value
    },

    handleSearchValue(value) {
      this.search = value
    },

    async getData() {
      if (this.tab === 'all') {
        await this.getAssetsData()
        await this.getTemplatesData()
        await this.getSchemasData()
        await this.getAccountsData()
      } else if (this.tab === 'assets') {
        this.getAssetsData()
      } else if (this.tab === 'templates') {
        this.getTemplatesData()
      } else if (this.tab === 'schemas') {
        this.getSchemasData()
      } else if (this.tab === 'accounts') {
        this.getAccountsData()
      }
    },

    handleSearch() {
      this.getData()
    },

    handleCollection(value) {
      this.currentCollectionName = value
      this.getData()
    },

    async getCollectionData() {
      const data = await this.$store.dispatch('api/getCollectionData')
      this.collectionData = data
    },

    async getAssetsData() {
      this.loading = true
      const data = await this.$store.dispatch('api/getAssetsData', {
        limit: this.limit,
        search: this.search,
        collectionName: this.currentCollectionName,
      })
      this.assetsData = data
      this.loading = false
    },

    async getTemplatesData() {
      this.loading = true
      const data = await this.$store.dispatch('api/getTemplatesData', {
        limit: this.limit,
        search: this.search,
        collectionName: this.currentCollectionName,
      })
      this.templatesData = data
      this.loading = false
    },

    async getSchemasData() {
      this.loading = true
      const data = await this.$store.dispatch('api/getSchemasData', {
        limit: this.limit,
        search: this.search,
        collectionName: this.currentCollectionName,
      })
      this.schemasData = data
      this.loading = false
    },

    async getAccountsData() {
      this.loading = true
      const data = await this.$store.dispatch('api/getAccountsData', {
        limit: this.limit,
        search: this.search,
        collectionName: this.currentCollectionName,
      })
      this.accountsData = data
      this.loading = false
    },
  },

  head() {
    return {
      title: `Alcor NFT Market | Trustless NFT market on ${this.network.name.toUpperCase()} chain`,

      meta: [
        {
          hid: 'description',
          name: 'description',
          content: 'Atomic, no fee, NFT marketplace.',
        },
      ],
    }
  },
}
</script>

<style lang="scss">
.j-container {
  .header {
    display: flex;
    gap: 25px;
    margin-bottom: 40px;
  }
}

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
}

h4 {
  margin: 24px 0;
}

div.grid-container {
  display: grid;
  grid-template-columns: auto auto auto auto;
  gap: 30px;
}

@media only screen and (max-width: 600px) {
  .market-cards .item {
    width: 100%;
  }
}
</style>
