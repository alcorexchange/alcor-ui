<template lang='pug'>
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
      CustomSkeletonVue(v-for='item in 10', :key='item', :height="330")
    .grid-container(v-else)
      .d-flex.justify-content-center(
        v-for='(item, index) in marketData',
        :key='index'
      )
        NormalCard(
          v-if='item',
          :data='item',
          :price='getPrice',
          :mode='currentTab',
          :getOverData='getInventoryOverData'
          :overData='overData'
        )
</template>

<script>
// import Vue from 'vue'
import { mapState } from 'vuex'
import NormalCard from '~/components/nft_markets/cards/NormalCard'
import MarketTab from '~/components/nft_markets/MarketTab'
import searchImg from '~/assets/images/search.svg'
import filterImg from '~/assets/images/filter.svg'
import downImg from '~/assets/images/down.svg'
import CustomSkeletonVue from '~/components/CustomSkeleton'

export default {
  components: {
    NormalCard,
    MarketTab,
    CustomSkeletonVue
  },

  data() {
    return {
      search: '',
      currentTab: 'market-sales',
      marketData: [],
      loading: true,
      collectionData: [],
      currentCollectionName: '',
      data: {
        searchIcon: searchImg,
        filterIcon: filterImg,
        downIcon: downImg
      },
      limit: 40,
      overData: ''
    }
  },
  computed: {
    ...mapState(['network', 'user']),
    ...mapState('wallet', ['systemPrice']),
    getPrice() {
      let price = this.systemPrice
      return price
    }
  },

  watch: {
    currentTab(newCurrnetTab, oldCurrentTab) {
      this.currentCollectionName = ''
      this.search = ''
      if (newCurrnetTab === 'market-sales') {
        this.getSaleData()
      } else {
        this.getAuctionData()
      }
    }
  },

  mounted() {
    this.getSaleData()
    this.getCollectionData()
  },

  methods: {
    handleTab(value) {
      this.currentTab = value
    },
    async getInventoryOverData(params) {
      this.overData = ''
      const templateStats = await this.getTemplateStats(params.collection_name, params.template_id)
      const specificAsset = await this.getSpecificAsset(params.collection_name, params.template_id)
      const assetsSales = await this.getAssetsSales(params.asset_id)
      const saleData = await this.getOverSale(params.collection_name, params.template_id)
      this.overData = {
        templateStats,
        specificAsset,
        assetsSales,
        saleData
      }
    },

    async getTemplateStats(collection_name, template_id) {
      return await this.$store.dispatch('api/getTemplateStats', {
        collection_name, template_id
      })
    },

    async getSpecificAsset(collection_name, template_id) {
      return await this.$store.dispatch('api/getAssets', {
        owner: this.user.name,
        collection_name,
        template_id
      })
    },

    async getAssetsSales(asset_id) {
      return await this.$store.dispatch('api/getAssetsSales', {
        asset_id
      })
    },

    async getOverSale(collectionName, template_id) {
      return await this.$store.dispatch('api/getSaleData', {
        collectionName, template_id, symbol: 'WAX', state: 1, limit: 1
      })
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
      const data = await this.$store.dispatch('api/getCollectionData', {
        author: ''
      })
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

<style lang='scss'>
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
