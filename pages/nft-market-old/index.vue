<template lang="pug">
.row.mt-3
  .col-lg-2.filters.pr-0
    .row.mb-2
      .col
        NewOrder
    .row
      .col
        el-card
          div(slot="header")
            span Authors
            // FIXME el-button(style="float: right;" size="mini" type="text" @click="clearAuthorFilters") CLEAR
          el-checkbox(
            v-for="author in authors"
            :key="author"
            @change="addAutorFilter(author)"
            :checked="isAuthorCheked(author)"
          ).w-100 {{ author }}

    .row.mt-2.mb-2
      .col
        el-card
          div(slot="header")
            span Categories
          el-checkbox(
            v-for="category in categories"
            :key="category"
            @change="addCatFilter(category)"
            :checked="isCatCheked(category)"
          ).w-100 {{ category }}

  .col-lg-10.pr-0
    .row
      .col
        .d-flex
          el-input(v-model="search" placeholder="Search NFT: ID/Name/Category/Author" clearable size="medium")

          nuxt-link(to="/nft-market/create").ml-3
            el-button(tag="el-button" icon="el-icon-plus" size="medium") Create NFT token

          nuxt-link(to="/wallet/nfts").ml-3
            el-button(type="info" icon="el-icon-wallet" size="medium") NFT Wallet
    hr

    .row
      .col
        el-alert(type="error" title="Beware of scammers!" show-icon)
          p
            | Anyone can create SimpleAssets NFTs and freely choose attributes such as name and image, including fake versions of existing NFTs or stolen intellectual property.
            | Before buying an NFT, always do your own research about the collection and double check the collection name to ensure that you are buying genuine NFTs.

    .row.mt-3
      .col
        .market-cards
          card.item(
            v-for="(order, i) in filteredOrders"
            :order="order"
            :key="order.id + i"
          )

</template>

<script>
import { mapState } from 'vuex'
import Card from '~/components/nft_markets/Card'
import NewOrder from '~/components/nft_markets/NewOrder'

export default {
  components: {
    Card,
    NewOrder
  },

  data() {
    return {
      search: '',

      sellOrders: []
    }
  },

  computed: {
    ...mapState(['network']),
    ...mapState('nft', ['orders', 'authorFilter', 'catFilter']),

    filteredOrders() {
      let orders = this.orders

      if (this.authorFilter.length > 0) orders = orders.filter(o => {
        return o.sell.some(s => this.authorFilter.includes(s.author))
      })

      if (this.catFilter.length > 0) orders = orders.filter(o => {
        return o.sell.some(s => this.catFilter.includes(s.category))
      })

      orders = orders.filter(o => {
        return o.sell.some(s => {
          const orderSearchData = s.author + s.category + s.id + JSON.stringify(s.idata) + JSON.stringify(s.mdata)
          return orderSearchData.toLowerCase().includes(this.search.toLowerCase())
        })
      })

      return orders
    },

    authors() {
      const authors = []

      this.orders.map(o => {
        o.sell.map(o => authors.push(o.author))
      })

      return Array.from(new Set(authors))
    },

    categories() {
      const categories = []

      this.orders.map(o => {
        o.sell.map(o => categories.push(o.category))
      })

      return Array.from(new Set(categories))
    }
  },

  mounted() {
    this.$store.dispatch('nft/fetch')
  },

  methods: {
    addAutorFilter(author) {
      if (this.authorFilter.includes(author)) {
        this.$store.commit('nft/setAuthorFilter', this.authorFilter.filter(a => a != author))
      } else {
        this.$store.commit('nft/setAuthorFilter', [...this.authorFilter, author])
      }
    },

    clearAuthorFilters() {
      this.$store.commit('nft/setAuthorFilter', [])
    },

    isAuthorCheked(author) {
      return this.authorFilter.includes(author)
    },

    addCatFilter(cat) {
      if (this.catFilter.includes(cat)) {
        this.$store.commit('nft/setCatFilter', this.catFilter.filter(a => a != cat))
      } else {
        this.$store.commit('nft/setCatFilter', [...this.catFilter, cat])
      }
    },

    clearCatFilters() {
      this.$store.commit('nft/setCatFilter', [])
    },

    isCatCheked(cat) {
      return this.catFilter.includes(cat)
    }
  },

  head() {
    return {
      title: `Alcor NFT Market | Trustless NFT market on ${this.network.name.toUpperCase()} chain`,

      meta: [
        { hid: 'description', name: 'description', content: 'Atomic, no fee, NFT marketplace.' }
      ]
    }
  }
}
</script>

<style>
.market-cards .el-card__header {
  padding: 10px 20px;
}

.market-cards {
  display: flex;
  flex-wrap: wrap!important;
  justify-content: space-between;
}

.market-cards .item {
  width: 32.8%;
  margin-bottom: 10px;
}

@media only screen and (max-width: 600px) {
  .market-cards .item {
    width: 100%;
  }
}

</style>
