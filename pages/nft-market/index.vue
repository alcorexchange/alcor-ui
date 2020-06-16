<template lang="pug">
.row.mt-3
  .col-lg-2.filters.pr-0
    .row.mb-3
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

    //el-menu(router default-active='2')
      el-menu-item(index='/nft-markets/all' disabled) Filter
      el-menu-item(index='/nft-markets/all' disabled) Category
  .col-lg-10.pr-0
    // TODO Fixed top
    //el-card
    .row
      .col
        .d-flex
          el-input(v-model="search" placeholder="Search NFT: ID/Name/Category/Author" clearable)

          nuxt-link(to="/nft-market/create").ml-3
            //.new-market-btn
            el-button(tag="el-button" icon="el-icon-plus") Create NFT token
      //.col-lg-4
      //.col-lg-8
    hr

    .row.mt-3
      .col
        .market-cards
          card.item(v-for="order in filteredOrders" :order="order")

</template>

<script>
import { mapState, mapGetters } from 'vuex'
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
    ...mapGetters('api', ['rpc']),

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
        console.log('includes..')
        this.$store.commit('nft/setAuthorFilter', this.authorFilter.filter(a => a != author))
      } else {
        this.$store.commit('nft/setAuthorFilter', [...this.authorFilter, author])
      }
    },

    clearAuthorFilters() {
      console.log('clear authorFilter', this.authorFilter)
      this.$store.commit('nft/setAuthorFilter', [])
      console.log(this.authorFilter)
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
        { hid: 'description', name: 'description', content: `Atomic, no fee, NFT marketplace.` }
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
