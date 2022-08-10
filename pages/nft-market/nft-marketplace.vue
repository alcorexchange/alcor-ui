<template lang="pug">
.j-container
  nuxt-link(:to='"/nft-market"', :exact='true')
    a#return-btn Return
  h4 Marketplace
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
      v-for='(item, index) in marketData',
      :key='index'
    )
      NormalCard(
        v-if='item',
        :data='item',
        :price='getPrice',
        :kindBut='currentTab',
        mode='market'
      )
</template>

<script>
// import Vue from 'vue'
import { mapState } from 'vuex'
import VueSkeletonLoader from 'skeleton-loader-vue'
import NormalCard from '~/components/nft_markets/NormalCard'
import MarketTab from '~/components/nft_markets/MarketTab'
import InputSearch from '~/components/nft_markets/InputSearch'
import MarketTabs from '~/components/nft_markets/MarketTabs'
import searchImg from '~/assets/images/search.svg'
import filterImg from '~/assets/images/filter.svg'
import downImg from '~/assets/images/down.svg'

export default {
  components: {
    NormalCard,
    MarketTab,
    InputSearch,
    MarketTabs,
    VueSkeletonLoader
  },

  data() {
    return {
      search: '',
      currentTab: 'sales',
      tab: 'sales',
      tabs: { sales: 'Sales', auctions: 'Auctions' },
      marketData: [],
      loading: true,
      collectionData: [],
      currentCollectionName: '',
      data: {
        searchIcon: searchImg,
        filterIcon: filterImg,
        downIcon: downImg,
      },
      limit: 40,
    }
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
    this.getSaleData()
    this.getCollectionData()
  },

  methods: {
    handleTab(value) {
      this.tab = value
    },

    handleSearchValue(value) {
      this.search = value
    },

    handleCollection(value) {
      this.currentCollectionName = value
      if (this.currentTab === 'sales') {
        this.getSaleData()
      } else {
        this.getAuctionData()
      }
    },

    handleSearch() {
      if (this.currentTab === 'sales') {
        this.getSaleData()
      } else {
        this.getAuctionData()
      }
    },

    async getCollectionData() {
      const data = await this.$store.dispatch('api/getCollectionData')
      this.collectionData = data
    },

    async getSaleData() {
      this.loading = true
      const data = await this.$store.dispatch('api/getSaleData', {
        limit: this.limit,
        search: this.search,
        collectionName: this.currentCollectionName
      })
      this.marketData = data
      this.loading = false
    },
    async getAuctionData() {
      this.loading = true
      const data = await this.$store.dispatch('api/getAuctionData', {
        limit: this.limit,
        search: this.search,
        collectionName: this.currentCollectionName
      })
      this.marketData = data
      this.loading = false
    }
  },

  watch: {
    search() {
      if (this.tab === 'sales') {
        this.getSaleData()
      } else {
        this.getAuctionData()
      }
    },
    tab(newTab) {
      this.currentCollectionName = ''
      this.search = ''
      if (newTab === 'sales') {
        this.getSaleData()
      } else {
        this.getAuctionData()
      }
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
  padding-left: 10px;
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
