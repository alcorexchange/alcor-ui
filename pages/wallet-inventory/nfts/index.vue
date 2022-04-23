<template lang="pug">
.nfts
  WalletNFTTab(
    :tabData='tabData',
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
      v-for='(item, index) in inventoryData',
      :key='index'
    )
      NormalCard(:data='item', mode='inventory')
</template>

<script>
import { mapState } from 'vuex'
import VueSkeletonLoader from 'skeleton-loader-vue'
import WalletNFTTab from '~/components/wallet/WalletNFTTab'
import NormalCard from '~/components/nft_markets/NormalCard'

export default {
  name: 'NFTs',
  components: {
    WalletNFTTab,
    NormalCard,
    VueSkeletonLoader,
  },
  data: () => ({
    search: '',
    loading: false,
    limit: 20,
    inventoryData: [],
    currentTab: 'inventory',
    collectionData: [],
    currentCollectionName: '',
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
  }),
  computed: {
    ...mapState(['network', 'user']),
    userData() {
      return this.user
    },
  },
  watch: {
    userData(newUserData, oldUserData) {
      if (!oldUserData && newUserData) {
        this.getAssets()
      }
    },
  },
  mounted() {
    this.getCollectionData()
    if (this.user) {
      this.getAssets()
    }
  },
  methods: {
    handleTab(value) {
      this.currentTab = value
    },

    async getAssets() {
      this.loading = true
      const data = await this.$store.dispatch('api/getAssets', {
        owner: this.user.name,
      })
      this.inventoryData = data
      this.loading = false
    },

    async getCollectionData() {
      const data = await this.$store.dispatch('api/getCollectionData')
      this.collectionData = data
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

<style scoped lang="scss">
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

div.grid-container {
  display: grid;
  grid-template-columns: auto auto auto auto;
  gap: 30px;
}
</style>
