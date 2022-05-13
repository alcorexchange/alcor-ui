<template lang="pug">
.j-container
  div
    nuxt-link(:to='"/nft-market"', :exact='true')
      a#return-btn Return
    h4 Marketplace
  MarketTab(
    :data='data',
    :currentTab='currentTab',
    :handleTab='handleTab',
    :handleSearch='handleSearch',
    :collectionData='collectionData',
    :handleCollection='handleCollection',
    :searchValue='search',
    :handleSearchValue='handleSearchValue'
  )
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
import searchImg from '~/assets/images/search.svg'
import filterImg from '~/assets/images/filter.svg'
import downImg from '~/assets/images/down.svg'

export default {
  components: {
    NormalCard,
    MarketTab,
    VueSkeletonLoader,
  },

  data() {
    return {
      search: '',
      currentTab: 'sales',
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
      this.currentTab = value
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
        collectionName: this.currentCollectionName,
      })
      this.marketData = data
      this.loading = false
    },
    async getAuctionData() {
      this.loading = true
      const data = await this.$store.dispatch('api/getAuctionData', {
        limit: this.limit,
        search: this.search,
        collectionName: this.currentCollectionName,
      })
      this.marketData = data
      this.loading = false
    },
  },

  watch: {
    currentTab(newCurrnetTab, oldCurrentTab) {
      this.currentCollectionName = ''
      this.search = ''
      if (newCurrnetTab === 'sales') {
        this.getSaleData()
      } else {
        this.getAuctionData()
      }
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
#return-btn::before {
  content: '←';
}

#return-btn {
  font-weight: 500;
  font-size: 14px;
  color: #9f979a !important;
  cursor: pointer;
  padding-left: 10px;
}

h4 {
  margin: 32px 0;
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
