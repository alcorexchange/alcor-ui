<template lang="pug">
.nfts
  WalletNFTHeader.mb-5
  .header
    InputSearch(v-model="search")
    MarketTabs(:tabs="tabs" v-model="currentTab" @change="handleTab")
  //- HorizontalMenu(
  //-   :tabs='currentTab != "inventory" ? (currentTab === "listings" ? horizontalTabData.normalTabs : horizontalTabData.auctionTabs) : []',
  //-   :currentTab='currentHorizontalTab',
  //-   :handleTab='handleHorizonalTab'
  //- )
  div(v-if='detailCollectionMode')
    .d-flex.justify-content-between.align-items-center.mb-4
      h1.text-capitalize.set-collection-name {{ setCollectionName }}
      .progress-panel
        .completed-sets-count Computer Sets: 2
        el-progress.completed-sets-progress(
          :text-inside='true',
          :stroke-width='26',
          :percentage='70',
          color='#67C23A'
        )
    WalletSetTab
    .grid-container
      .d-flex.justify-content-center(
        v-for='(item, index) in collectionSets',
        :key='index'
      )
        NormalCard(
          :data='item',
          :mode='currentTab === "sets" && detailCollectionMode ? "setsList" : ""',
          :kindBut='currentTab != "inventory" ? "all" : ""'
        )
  div(v-else)
    div(
      v-if='currentTab === "inventory" || currentTab === "listings" || currentTab === "auctions" || currentTab === "sets"'
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
          v-for='(item, index) in inventoryData',
          :key='index'
        )
          NormalCard(
            :data='item',
            :mode='currentTab',
            :kindBut='currentTab != "inventory" ? "all" : ""'
          )
    div(v-else-if='currentTab === "sold" || currentTab === "bought"')
      .d-flex.justify-content-between(v-if='loading')
        vue-skeleton-loader(
          :width='600',
          :height='380',
          animation='wave',
          wave-color='rgba(150, 150, 150, 0.1)',
          :rounded='true'
        )
        vue-skeleton-loader(
          :width='220',
          :height='380',
          animation='wave',
          wave-color='rgba(150, 150, 150, 0.1)',
          :rounded='true'
        )
      div(v-else)
        DetailWithCardPanel(
          v-for='(item, index) in inventoryData',
          :key='index',
          :data='item',
          :mode='currentTab'
        )
</template>

<script>
import { mapState } from 'vuex'
import VueSkeletonLoader from 'skeleton-loader-vue'
import WalletNFTTab from '~/components/wallet/WalletNFTTab'
import HorizontalMenu from '~/components/wallet/HorizontalMenu'
import NormalCard from '~/components/nft_markets/NormalCard'
import InputSearch from '~/components/nft_markets/InputSearch'
import MarketTabs from '~/components/nft_markets/MarketTabs'
import DetailWithCardPanel from '~/components/nft_markets/DetailWithCardPanel'
import WalletSetTab from '~/components/wallet/WalletSetTab.vue'
import WalletNFTHeader from '~/components/wallet/WalletNFTHeader.vue'

export default {
  name: 'NFTs',
  components: {
    WalletNFTHeader,
    WalletNFTTab,
    NormalCard,
    VueSkeletonLoader,
    MarketTabs,
    InputSearch,
    HorizontalMenu,
    DetailWithCardPanel,
    WalletSetTab,
  },
  data: () => ({
    search: '',
    loading: false,
    limit: 20,
    inventoryData: [],
    salesData: [],
    auctionsData: [],
    currentTab: '',
    tabs: { inventory: 'Inventory', listings: 'Listings', auctions: 'Auctions', sold: 'Sold', bought: 'Bought', sets: 'Sets' },
    currentHorizontalTab: 'open-auctoins',
    collectionData: [],
    currentCollectionName: '',
    horizontalTabData: {
      normalTabs: [
        {
          title: 'Sales',
          slug: 'sales',
        },
        {
          title: 'Auctions',
          slug: 'auctions',
        },
      ],
      auctionTabs: [
        {
          title: 'Open Auctions',
          slug: 'open-auctoins',
        },
        {
          title: 'Lost Auctions',
          slug: 'lost-auctions',
        },
      ],
    },
    tabData: [
      {
        title: 'Inventory',
        slug: 'inventory',
      },
      {
        title: 'Listings',
        slug: 'listings',
      },
      {
        title: 'Auctions',
        slug: 'auctions',
      },
      {
        title: 'Sold',
        slug: 'sold',
      },
      {
        title: 'Bought',
        slug: 'bought',
      },
      {
        title: 'Sets',
        slug: 'sets',
      },
    ],
    selectedCollectionName: '',
    collectionSets: [],
    detailCollectionMode: false,
  }),
  computed: {
    ...mapState(['network', 'user']),
    userData() {
      return this.user
    },
    setCollectionName() {
      if (this.collectionSets.length) {
        return this.collectionSets[0].collection.name
      } else return ''
    },
  },
  watch: {
    userData(newUserData, oldUserData) {
      if (!oldUserData && newUserData) {
        const tab = this.$route.hash.split('#')[1]
        if (tab) {
          if (tab.split('-')[1]) {
            this.currentTab = 'sets'
            this.detailCollectionMode = true
            this.selectedCollectionName = this.$route.hash
              .split('#')[1]
              .split('-')[1]
          } else {
            this.currentTab = tab
          }
        } else this.currentTab = 'inventory'
      }
    },
    $route(to, from) {
      if (to.hash.includes('#sets-')) {
        this.currentTab = 'sets'
        this.detailCollectionMode = true
        this.selectedCollectionName = to.hash.split('#')[1].split('-')[1]
      } else {
        this.detailCollectionMode = false
        this.currentTab = to.hash.split('#')[1]
      }
    },
    currentTab(new_tab, old_tab) {
      this.getData(new_tab)
    },
    search() {
      this.getData(this.currentTab)
    },
    detailCollectionMode(new_mode, old_mode) {
      if (new_mode) {
        this.getCollectionSets()
      }
    },
    currentHorizontalTab(new_tab, old_tab) {
      if (new_tab === 'sales' || new_tab === 'open-auctions') {
        this.inventoryData = this.salesData
      } else this.inventoryData = this.auctionsData
    },
  },
  mounted() {
    this.getCollectionData()
    if (this.user) {
      if (this.$route.hash.includes('#')) {
        if (this.$route.hash.includes('#set-')) {
          this.currentTab = 'sets'
        } else {
          this.currentTab = this.$route.hash.split('#')[1]
          this.getData(this.$route.hash.split('#')[1])
        }
      } else this.currentTab = 'inventory'
    }
  },
  methods: {
    handleTab(value) {
      this.currentTab = value
    },
    handleHorizonalTab(value) {
      this.currentHorizontalTab = value
    },

    getData(value) {
      if (value === 'inventory') {
        this.getAssets()
      } else if (value === 'listings') {
        this.getListing()
        this.currentHorizontalTab = 'sales'
      } else if (value === 'auctions') {
        this.getAuctions()
        this.currentHorizontalTab = 'open-auctoins'
      } else if (value === 'sold') {
        this.getSold()
      } else if (value === 'bought') {
        this.getBought()
      } else if (value === 'sets') {
        this.getCollections()
      }
    },

    async getAssets() {
      this.loading = true
      const data = await this.$store.dispatch('api/getAssets', {
        owner: this.user.name,
      })

      Promise.all(
        data.map(({ asset_id }) =>
          this.$store.dispatch('api/getAssetsSales', { asset_id, buyer: this.user.name }))
      ).then(assetsSales => {
        assetsSales.forEach((sales, idx) =>
          data[idx].purchasePrice = sales.sort((a, b) => b.block_time - a.block_time)[0]
        )
        this.inventoryData = data
        this.loading = false
      })
    },

    async getListing() {
      this.loading = true
      const auctionData = await this.$store.dispatch('api/getAuctionData', {
        seller: this.user.name,
        state: '0,1,4',
      })
      const salesData = await this.$store.dispatch('api/getSales', {
        seller: this.user.name,
        state: '0,1,4',
      })
      // this.salesData = salesData
      // this.auctionsData = auctionData
      this.inventoryData = [...salesData, ...auctionData]
      this.loading = false
    },

    async getAuctions() {
      this.loading = true
      const openAuctions = await this.$store.dispatch('api/getAuctionData', {
        participant: this.user.name,
      })
      const lostAuctions = await this.$store.dispatch('api/getAuctionData', {
        bidder: this.user.name,
        buyer_blacklist: this.user.name,
        state: '3',
      })
      // this.salesData = openAuctions
      // this.auctionsData = lostAuctions
      this.inventoryData = [...openAuctions, ...lostAuctions]
      this.loading = false
    },

    async getSold() {
      this.loading = true
      const auctionsData = await this.$store.dispatch('api/getAuctionData', {
        seller: this.user.name,
        state: '3',
      })
      const salesData = await this.$store.dispatch('api/getSales', {
        seller: this.user.name,
        state: '3',
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
        state: '3',
      })
      const salesData = await this.$store.dispatch('api/getSales', {
        buyer: this.user.name,
        state: '3',
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
        data: 'ss',
      })
      this.collectionData = data
    },

    async getCollectionSets() {
      const data = await this.$store.dispatch('api/getCollectionSets', {
        collection_name: this.selectedCollectionName,
      })
      this.collectionSets = data.data
    },

    handleCollection(value) {
      this.currentCollectionName = value
      this.getAssets()
    },

    handleSearchValue(value) {
      this.search = value
    },

    handleSearch() {
      this.getAssets()
    },
  },
}
</script>
<style lang="scss">
.el-progress.completed-sets-progress {
  width: 220px;
  background: #161617;
  border-radius: 4px;

  .el-progress-bar__outer {
    border-radius: 4px;

    .el-progress-bar__inner {
      border-radius: 4px;
    }
  }
}
</style>
<style scoped lang="scss">
.nfts {
  .header {
    display: flex;
    gap: 25px;
    margin-bottom: 40px;
  }
}

.table-header {
  display: flex;
  align-items: center;
  margin-bottom: 10px;

  .el-input {
    max-width: 300px;
  }

  .el-input__inner {
    background: transparent !important;
  }
}

.items {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 56px;
}

@media only screen and (max-width: 1040px) {
  .items {
    gap: 20px;
  }
}

@media only screen and (max-width: 840px) {
  .items {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }
}

@media only screen and (max-width: 540px) {
  .items {
    grid-template-columns: 100%;
    gap: 10px;
  }
}

.set-collection-name {
  font-size: 36px;
}

div.grid-container {
  display: flex;
  gap: 40px;
  flex-wrap: wrap;
}
</style>
