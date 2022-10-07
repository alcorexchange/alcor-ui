<template lang="pug">
.j-container
  div
    nuxt-link(:to='"/nft-market"', :exact='true')
      a#return-btn Return
    h4 Explorer
  .header
    InputSearch(v-model="search")
    MarketTabs(:tabs="tabs" v-model="tab" @change="handleTab")
  .message(v-if='tab === "accounts" && !search && !accountsData.length',) Accounts can only be searched
  .grid-container(v-if='loading && tab != "accounts"')
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
    .d-flex.justify-content-center(
      v-if='tab === "accounts"',
      v-for='(item, index) in accountsData',
      :key='"accounts-" + index'
    )
      account-card(
        :key='"accounts-" + index'
        v-if='item'
        :data="item"
      )

</template>

<script>
// import Vue from 'vue'
import { mapState, mapActions } from 'vuex'
import VueSkeletonLoader from 'skeleton-loader-vue'
import NormalCard from '~/components/nft_markets/NormalCard'
import AccountCard from '~/components/cards/AccountCard.vue'
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
    AccountCard,
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
      assetsCountLoaded: false,
      suggestedAverageLoaded: false,
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
    ...mapActions('api', ['getAccountDetails', 'getinventorycounts']),
    ...mapActions('social', ['getPhotoHash']),
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
        //await this.getAccountsData()
      } else if (this.tab === 'assets') {
        this.getAssetsData()
      } else if (this.tab === 'templates') {
        this.getTemplatesData()
      } else if (this.tab === 'schemas') {
        this.getSchemasData()
      } else if (this.tab === 'accounts' && this.search) {
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
      this.suggestedAverageLoaded = false
      this.assetsCountLoaded = false
      const data = await this.$store.dispatch('api/getAccountsData', { search: this.search, limit: 20 })
      this.accountsData = data.map(({ scope }) => ({ name: scope, suggested_average: 0, assetsCount: 0, imgSrc: '' }))
      this.loading = false

      Promise.all(data.map(({ scope }) => {
        return this.getAccountDetails(scope)
      })).then(r => {
        r.forEach(({ data }, idx) => {
          this.accountsData[idx].suggested_average = data.data
            .reduce((acc, { suggested_median, token_precision }) =>
              acc += suggested_median / Math.pow(10, token_precision), 0) / data.data.length
        })
        this.suggestedAverageLoaded = true
      })

      Promise.all(data.map(({ scope }) => {
        return this.getinventorycounts({ owner: scope })
      })).then(r => {
        r.forEach((count, idx) => {
          this.accountsData[idx].assetsCount = count
        })
        this.assetsCountLoaded = true
      })

      Promise.all(data.map(({ scope }) => {
        return this.getPhotoHash(scope)
      })).then(r => {
        r.forEach((hash, idx) => {
          this.accountsData[idx].imgSrc = hash && `https://gateway.pinata.cloud/ipfs/${hash}`
        })
      })
    }
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

.message {
  text-align: center;
}
</style>
