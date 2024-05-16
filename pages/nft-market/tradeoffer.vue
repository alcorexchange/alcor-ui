<template lang="pug">
.j-container
  .row
    .col-6(style='display:flex')
      img(src='~/assets/images/small_shape.svg',style='width:42px;height:42px')
      p(style='padding:7px;size:20px') flfum.wam
  .d-flex.justify-content-between.row(style="padding:17px 22px;margin:21px 0;background-color:#202021;border-radius:6px")
    .chart-items
      p Portfolio value
      h5
        span 1500.243
        span WAX
      p = $229.11
    .chart-items
      p Active positions
      h5
        span.color-green 7 Buy
        span &nbsp;|&nbsp;
        span.color-red 8 Sell
      p 5 pairs
    .chart-items
      p Available funds
      h5
        span 1500.243
        span WAX
      p = $229.11
    .chart-items
      p Staking rewards
      h5
        span 1500.243
        span WAX
      p Last Claim: 0.00005
    .chart-items
      p LP rewards
      h5
        span.color-green 1500.243
        span WAX
      p 2 Liquidity Pools
  .trade-btn-group.d-flex.justify-content-between.row(style="padding:17px 22px;")
    p Tokens
    p Positions
    p Transactions
    p.active-btn NFT's
    p Liquidity Pools
    p Resources
  .d-flex.justify-content-between.row(style="padding:17px 22px;margin:21px 0;background-color:#202021;border-radius:6px")
    .chart-items
      p NFT inventory
      .d-flex.justify-content-start.align-items-end
        h5.mb-0 32
        p NFTs
      p = $28.72
    .chart-items
      p Active Auctions
      .d-flex.justify-content-start.align-items-end
        h5.mb-0 0
        p.color-red NFTs
      p = $0.00
    .chart-items
      p Active Listings
      .d-flex.justify-content-start.align-items-end
        h5.mb-0 5
        p NFTs
      p = $229.11
    .chart-items
      p Total Bought
      .d-flex.justify-content-start.align-items-end
        h5.mb-0 150.243
        p.color-yellow WAX
      p =  $187.35
    .chart-items
      p Total Sold
      .d-flex.justify-content-start.align-items-end
        h5.mb-0 1500.243
        p.color-yellow WAX
      p =  $187.35
  .nft-container.j-container
    .row
      .col-6(style='display:flex')
        img(src='~/assets/images/small_shape.svg',style='width:42px;height:42px')
        p(style='padding:7px;size:20px') flfum.wam
      .col-6(style='display:flex')
        img(src="../../assets/images/small_shape_gradient.svg")
        p(style='padding:7px;size:20px') gchad.wam
  .row
    .col-6.p-4
      .row(style='background-color:black;border:2px solid green;border-radius:6px')
        .col-4.py-2(style='text-align:center;padding:3px;' v-for='(item, index) in imageItems' :key='index')
          div(style='padding:5px;margin:auto;background-color:#202021;border-radius:5px')
            div(:style="{ backgroundImage:`url(${require('~/assets/images/alctrix.svg')})`,height:'150px',backgroundSize:'100%'}")
            p(style='margin: 5px 0;color:#66C167;text-align:center;background-color:#202021;font-size:18px') {{item['name']}}
            span.cross-btn
        .col-4.py-2(style='text-align:center;padding:3px;color:green')
          a.add-nft-btn Click on an NFT's add button
    .col-6.p-4
      .row(style='background-color:black;border:2px solid green;border-radius:6px')
        .col-4.py-2(style='text-align:center;padding:3px;' v-for='(item, index) in imageItems' :key='index')
          div(style='padding:5px;margin:auto;background-color:#202021;border-radius:5px')
            div(:style="{ backgroundImage:`url(${require('~/assets/images/nft_purple.svg')})`,height:'150px',backgroundSize:'100%'}")
            p(style='margin: 5px 0;color:#66C167;text-align:center;background-color:#202021;font-size:18px') {{item['name']}}
            span.cross-btn
        .col-4.py-2(style='text-align:center;padding:3px;color:green')
          a.add-nft-btn Click on an NFT's add button
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
import NftCard from '~/components/nft_markets/NftCard'
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
      imageItems: [
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

@media only screen and (max-width: 600px) {
  .market-cards .item {
    width: 100%;
  }
}
.cross-btn{
  width: 15px;
  height: 15px;
  cursor: pointer;
  // background-image:url(../../assets/images/cross1.png);
  position:absolute;
  top: 7px;
  right: 15px;
  background-size: 100% auto;
  background-repeat: no-repeat;
  opacity: 0;
  text-shadow: 0 0 3px #FF0000, 0 0 5px #0000FF;
}
.cross-btn:hover {
  opacity: 1;
}
.add-nft-btn {
    background: #202021;
    border-radius: 6px;
    position: absolute;
    // width: 129px;
    height: 93%;
    left: 14px;
    top: 8px;
    font-family: "Roboto";
    font-style: normal;
    font-weight: 500;
    font-size: 14px;
    line-height: 16px;
    display: flex;
    align-items: center;
    text-align: center;
    color: #67C23A;
    opacity: 0.9;
}

</style>
