<template lang="pug">
.nft-container.j-container
  .grid-container.row
    .card-container.lg-6.md-12.sm-12.xl-12(
      v-for='(card, index) in cardData',
      :key='index'
    )
      NftCard(:data='card')
    .lg-12.md-12.sm-12.xl-12.relation-item
      NftRelation(:data='relationData', :price='getPrice')
  #loading.d-flex.justify-content-center(v-if='!filteredOrders.length')
    .spinner-border(role='status')
      span.sr-only Loading...
  h1.recent-title(v-if='filteredOrders.length') Recent Listenings
  VueSlickCarousel(v-if='filteredOrders.length', v-bind='settings')
    .d-flex.justify-content-center(
      v-for='(item, index) in filteredOrders.slice(0, 5)',
      :key='index'
    )
      NormalCard(
        v-if='item',
        :data='item',
        :price='getPrice',
        :kindBut='"sales"'
      )
  h1.recent-title(v-if='filteredOrders.length') New NFTs
  VueSlickCarousel(v-if='filteredOrders.length', v-bind='settings')
    .d-flex.justify-content-center(
      v-for='(item, index) in filteredOrders.reverse().slice(0, 5)',
      :key='index'
    )
      NormalCard(
        v-if='item',
        :data='item',
        :price='getPrice',
        :kindBut='"sendoffer"'
      )
</template>

<script>
import { mapState } from 'vuex'
// import axios from 'axios'
import VueSlickCarousel from 'vue-slick-carousel'
import NftCard from '~/components/nft_markets/NftCard'
import NftRelation from '~/components/nft_markets/NftRelation'
import NormalCard from '~/components/nft_markets/NormalCard'
import Img1 from '~/assets/images/nft_marketplace.webm'
import Img2 from '~/assets/images/wallet.webm'
import Img3 from '~/assets/images/nft_explorer.webm'
import Img4 from '~/assets/images/nft.webm'
import subImg from '~/assets/icons/wax.png'
import 'vue-slick-carousel/dist/vue-slick-carousel.css'
import 'vue-slick-carousel/dist/vue-slick-carousel-theme.css'

export default {
  components: {
    NftCard,
    NftRelation,
    NormalCard,
    VueSlickCarousel,
  },

  data() {
    return {
      title: 'ABC',
      cardData: [
        {
          title: 'ALCOR',
          subTItle: 'NFT MARKETPLACE',
          img: Img1,
          to: '/nft-market/marketplace',
        },
        {
          title: 'WALLET',
          subTItle: 'flfum.wam',
          img: Img2,
          subImage: subImg,
          to: '/nft-market/walletinventory',
        },
        {
          title: 'ALCOR',
          subTItle: 'NFT EXPLORER',
          img: Img3,
          to: '/nft-market/nftexplorer',
        },
        {
          title: 'ALCOR',
          subTItle: 'CREATE NFT',
          img: Img4,
          to: '/nft-market/createnft',
        },
      ],
      relationData: '',
      normalcardData: [
        {
          title: 'ALCOR',
          subTItle: 'NFT MARKETPLACE',
          img: Img1,
        },
        {
          title: 'WALLET',
          subTItle: 'flfum.wam',
          img: Img2,
          subImage: subImg,
        },
        {
          title: 'ALCOR',
          subTItle: 'NFT EXPLORER',
          img: Img3,
        },
        {
          title: 'ALCOR',
          subTItle: 'CREATE NFT',
          img: Img4,
        },
      ],
      search: '',
      sellOrders: [],
      settings: {
        dots: false,
        focusOnSelect: true,
        infinite: true,
        autoplay: false,
        speed: 500,
        slidesToShow: 4,
        slidesToScroll: 1,
        touchThreshold: 5,
        autoplaySpeed: 4600,
        swipeToSlide: true,
        responsive: [
          {
            breakpoint: 1024,
            settings: {
              arrows: false,
              slidesToShow: 3,
              slidesToScroll: 3,
              infinite: true,
              dots: true,
            },
          },
          {
            breakpoint: 600,
            settings: {
              arrows: false,
              slidesToShow: 2,
              slidesToScroll: 2,
              initialSlide: 2,
            },
          },
          {
            breakpoint: 480,
            settings: {
              arrows: false,
              slidesToShow: 1,
              slidesToScroll: 1,
            },
          },
        ],
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
    this.getSymbolInfo()
  },

  methods: {
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

    async getSymbolInfo() {
      const data = await this.$store.dispatch('api/getSymbolInfo')
      this.relationData = data
    }
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

<style>
.nft-container {
  margin-top: 30px;
}
.nft-container .grid-container {
  display: flex;
  justify-content: space-between;
  width: calc(100% - 20px);
  margin: auto;
}
.card-container {
  width: 440px;
  height: 200px;
  margin-bottom: 30px;
}
#loading {
  margin-top: 20px;
  position: relative;
}

.slick-prev:before,
.slick-next:before {
  content: '';
}
.slick-prev,
.slick-prev:hover,
.slick-next,
.slick-next:hover {
  background: url('~/assets/images/left_arrow.png') !important;
  background-size: 100% 100% !important;
  width: 12.5px !important;
  height: 25px !important;
}

.slick-next,
.slick-next:hover {
  background: url('~/assets/images/right_arrow.png') !important;
  background-size: 100% 100% !important;
}

.relation-item {
  width: 100%;
}
.recent-title {
  margin: 30px 0;
  font-size: 36px;
  font-weight: bold;
  color: #fff;
}

@media only screen and (max-width: 1000px) {
  .nft-container .grid-container {
    justify-content: center;
    width: calc(100% - 25px);
  }
}
</style>
