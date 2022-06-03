<template lang="pug">
.tradeoffer
  .nft-container.j-container
    .row
      .col-6.d-flex
        img.flfum-img(src='~/assets/images/small_shape.svg')
        p.p-7 flfum.wam
      .col-6.d-flex
        img(src="../../assets/images/small_shape_gradient.svg")
        p.p-7 gchad.wam
  .row
    .col-6.p-4
      .row.nft-create-section
        .col-4.py-2.text-center.p-1(v-for='(item, index) in imageItems1' :key='index')
          .create-section-item
            div(:style="{ backgroundImage:`url(${require('~/assets/images/alctrix.svg')})`}")
            p.section-item_name {{item['name']}}
            span.cross-btn(@click="deleteItem1(item['id'])" :style="{ backgroundImage:`url(${require('~/assets/images/cross.svg')})`}")
        .col-4.py-2.add-btn-container.text-center(@click="addItem1")
          .create-section-item.add-btn
            a.add-nft-btn Click on an <br> NFT's add <br> button
    .col-6.p-4
      .row.nft-create-section
        .col-4.py-2.text-center.p-1(v-for='(item, index) in imageItems2' :key='index')
          .create-section-item
            div(:style="{ backgroundImage:`url(${require('~/assets/images/nft_purple.svg')})`}")
            p.section-item_name {{item['name']}}
            span.cross-btn(@click="deleteItem2(item['id'])" :style="{ backgroundImage:`url(${require('~/assets/images/cross.svg')})`}")
        .col-4.py-2.add-btn-container.text-center(@click="addItem2")
          .create-section-item.add-btn
            a.add-nft-btn Click on an <br> NFT's add <br> button
  TradeofferTab(:data='data' :currentTab='currentTab' :handleTab='handleTab')
  #loading.d-flex.justify-content-center(v-if='!filteredOrders.length')
    .spinner-border(role='status')
      span.sr-only Loading...
  .grid-container
    .d-flex.justify-content-center(v-for='(item, index) in filteredOrders.slice(0, 8)' :key='index')
      TradeOfferCard(v-if='item' :data='item' :kindBut='currentTab')
</template>

<script>

// import Vue from 'vue'
import { mapState } from 'vuex'
import TradeOfferCard from '~/components/nft_markets/TradeOfferCard'
import TradeofferTab from '~/components/nft_markets/TradeofferTab'
import searchImg from '~/assets/images/search.svg'
import filterImg from '~/assets/images/filter.svg'
import downImg from '~/assets/images/down.svg'
export default {
  components: {
    TradeOfferCard,
    TradeofferTab,
  },
  data() {
    return {
      search: '',
      sellOrders: [],
      tabIndex: 0,
      currentTab: 'your',
      imageItems1: [
        { id: 0, name: '-|AlcTrix|-' },
        { id: 1, name: 'Alc' },
        { id: 2, name: 'strike' },
        { id: 3, name: 'fourth' },
      ],
      imageItems2: [
        { id: 0, name: '-|AlcTrix|-' },
        { id: 1, name: 'Alc' },
        { id: 2, name: 'strike' },
        { id: 3, name: 'fourth' },
      ],
      data: {
        searchIcon: searchImg,
        filterIcon: filterImg,
        downIcon: downImg,
      }
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
    items() {
      return ['afssfe', 'sefsefs', 'afewffw']
    },
    authors() {
      const authors = []

      this.orders.map((o) => {
        o.sell.map((o) => authors.push(o.author))
      })

      return Array.from(new Set(authors))
    },

    // getPrice() {
    //   let price = this.systemPrice
    //   return price
    // },

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
    deleteItem1(id) {
      this.imageItems1 = this.imageItems1.filter((item) => item.id != id)
    },
    addItem1() {
      if (this.imageItems1.length)
        this.imageItems1.push({ id: this.imageItems1[this.imageItems1.length - 1].id + 1, name: 'Unknown' })
      else
        this.imageItems1.push({ id: 0, name: 'Unknown' })
    },
    deleteItem2(id) {
      this.imageItems2 = this.imageItems2.filter((item) => item.id != id)
    },
    addItem2() {
      if (this.imageItems2.length)
        this.imageItems2.push({ id: this.imageItems2[this.imageItems2.length - 1].id + 1, name: 'Unknown' })
      else
        this.imageItems2.push({ id: 0, name: 'Unknown' })
    },
    handleTab (value) {
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
.tradeoffer {
  .normalcard {
    padding: 6px 10px;
  }
  .add-btn {
    padding: 91px 0 !important;
    a {
      color: #67C23A !important;
    }
  }
  // .normal-card header {
  //   padding: 5px 0;
  // }
  // .nft-info {
  //   h5 {
  //     font-size: 14px;
  //   }
  //   input {
  //     color: #9F979A;
  //     width: 100%;
  //     padding: 2px 8px;
  //     background-color: #161617;
  //     margin: 12px 0;
  //     border: none;
  //     border-radius: 2px;
  //   }
  //   p {
  //     color: #FF4949;
  //     font-size: 12px;
  //   }
  // }
  .nft-container.j-container {
    max-width: none;
  }
  .add-btn-container {
    padding: 3px;
    color: green;
  }
  .create-section-item {
    div:first-child {
      height: 200px;
      background-size: 100% 100%;
    }
    padding:5px;
    margin:auto;
    background-color:#202021;
    border-radius:5px;
  }
  .section-item_name {
    margin: 5px 0;
    color:#66C167;
    text-align:center;
    background-color:#202021;
    font-size:18px;
  }
  .flfum-img {
    width: 42px;
    height: 42px;
  }
  .p-7 {
    padding: 7px;
  }
  .nft-create-section {
    background-color:black;
    border:2px solid green;
    border-radius:6px;
  }
  .flfum-title {
    padding:7px;
    font-size:20px;
  }
  .chart-items {
    font-size: 12px;
    p:first-child {
      margin-bottom: 10px;
    }
  }
  .color-yellow {
    color: #F89022;
  }
  .color-green {
    color: #66C167;
  }
  .color-red {
    color: #C76D59;
  }
  .trade-btn-group p {
    font-size: 14px;
    border-radius: 8px;
    padding: 16px 19px;
    background-color: #333;
    text-align: center;
    width: 136px;
    margin: 0;
    cursor: pointer;
    &.active-btn {
      background-color: #161617;
    }
  }
  #return-btn::before {
    content: '←';
  }
  #return-btn {
    font-weight: 500;
    font-size: 16px;
    font-weight: 700;
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
  .cross-btn{
    width: 20px;
    height: 20px;
    cursor: pointer;
    position:absolute;
    top: 8px;
    right: 4px;
    background-size: 100% auto;
    background-repeat: no-repeat;
    opacity: 0.8;
    text-shadow: 0 0 3px #FF0000, 0 0 5px #0000FF;
  }
  .cross-btn:hover {
    opacity: 1;
  }
  .add-btn-container {
    border-radius: 6px;
    font-weight: 500;
    font-size: 14px;
    color: #67C23A;
  }
}
</style>
