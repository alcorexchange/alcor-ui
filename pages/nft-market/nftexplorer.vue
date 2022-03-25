<template lang="pug">
.j-container
  div
    nuxt-link(:to='"/nft-market"' :exact="true")
      a#return-btn Return
    h4 Explorer
  ExplorerTab(:data='data', :currentTab='currentTab', :handleTab='handleTab')
  .grid-container
    .d-flex.justify-content-center(
      v-for='(item, index) in filteredOrders.slice(0, 16)',
      :key='index'
    )
      NormalCard(
        v-if='item',
        :data='item',
        :price='getPrice',
        :kindBut='currentTab'
      )
  #loading.d-flex.justify-content-center(v-if='!filteredOrders.length')
    .spinner-border(role='status')
      span.sr-only Loading...
</template>

<script>
// import Vue from 'vue'
import { mapState } from 'vuex'
import NormalCard from '~/components/nft_markets/NormalCard'
import ExplorerTab from '~/components/nft_markets/ExplorerTab'
import searchImg from '~/assets/images/search.svg'
import filterImg from '~/assets/images/filter.svg'
import downImg from '~/assets/images/down.svg'

export default {
  components: {
    NormalCard,
    ExplorerTab,
  },

  data() {
    return {
      search: '',
      sellOrders: [],
      tabIndex: 0,
      currentTab: 'all',
      data: {
        searchIcon: searchImg,
        filterIcon: filterImg,
        downIcon: downImg,
      },
    }
  },

  computed: {
    ...mapState(['network']),
    ...mapState('nft', ['orders', 'authorFilter', 'catFilter']),
    ...mapState('wallet', ['systemPrice']),

    filteredOrders() {
      let orders = this.orders

      if (this.authorFilter.length > 0)
        orders = orders.filter((o) => {
          return o.sell.some((s) => this.authorFilter.includes(s.author))
        })

      if (this.catFilter.length > 0)
        orders = orders.filter((o) => {
          return o.sell.some((s) => this.catFilter.includes(s.category))
        })

      orders = orders.filter((o) => {
        return o.sell.some((s) => {
          const orderSearchData =
            s.author +
            s.category +
            s.id +
            JSON.stringify(s.idata) +
            JSON.stringify(s.mdata)
          return orderSearchData
            .toLowerCase()
            .includes(this.search.toLowerCase())
        })
      })

      return orders
    },

    authors() {
      const authors = []

      this.orders.map((o) => {
        o.sell.map((o) => authors.push(o.author))
      })

      return Array.from(new Set(authors))
    },

    getPrice() {
      let price = this.systemPrice
      return price
    },

    categories() {
      const categories = []

      this.orders.map((o) => {
        o.sell.map((o) => categories.push(o.category))
      })

      return Array.from(new Set(categories))
    },
  },

  mounted() {
    this.$store.dispatch('nft/fetch')
  },

  methods: {
    handleTab(value) {
      this.currentTab = value
    },

    linkClass(idx) {
      if (this.tabIndex === idx) {
        return ['bg-primary', 'text-light']
      } else {
        return ['bg-light', 'text-info']
      }
    },
    addAutorFilter(author) {
      if (this.authorFilter.includes(author)) {
        this.$store.commit(
          'nft/setAuthorFilter',
          this.authorFilter.filter((a) => a != author)
        )
      } else {
        this.$store.commit('nft/setAuthorFilter', [
          ...this.authorFilter,
          author,
        ])
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
        this.$store.commit(
          'nft/setCatFilter',
          this.catFilter.filter((a) => a != cat)
        )
      } else {
        this.$store.commit('nft/setCatFilter', [...this.catFilter, cat])
      }
    },

    clearCatFilters() {
      this.$store.commit('nft/setCatFilter', [])
    },

    isCatCheked(cat) {
      return this.catFilter.includes(cat)
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
