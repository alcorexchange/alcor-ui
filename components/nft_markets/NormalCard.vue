<template lang="pug">
nuxt-link.normalcard.radius10(
  v-if='mode === "sets"',
  :to='"#sets-" + data.collection_name'
)
  video.main-img.radius10(v-if='videoBackground', autoplay='true', loop='true')
    source(
      :src='"https://resizer.atomichub.io/videos/v1/preview?ipfs=" + videoBackground.video + "&size=370&output=mp4"',
      type='video/mp4'
    )
  .main-img.radius10(v-else-if='imageBackground', :style='imageBackground')
  .main-img.radius10(v-else, :style='defaultBackground')
  .offer-information(v-if='mode === "sets"')
    p.wax-name.text-center.mt-3.text-white {{ cardName }}
.normalcard.radius10(v-else)
  header.d-flex.justify-content-between.mb-1(
    v-if='mode != "templates" && mode != "sets" && mode != "setsList"'
  )
    div
      img(src='~/assets/images/small_shape.svg')
      span.card-title {{ cardTitle }}
    .d-flex.align-items-center(v-if='mode != "schemas"')
      img.ml-1(src='~/assets/images/double_arrow.svg', alt='')
      img.ml-1(src='~/assets/images/fire.svg', alt='')
      .card_number.d-flex.align-items-center.ml-1 {{ "#" + mintCount }}
  video.main-img.radius10(v-if='videoBackground', autoplay='true', loop='true')
    source(
      :src='"https://resizer.atomichub.io/videos/v1/preview?ipfs=" + videoBackground.video + "&size=370&output=mp4"',
      type='video/mp4'
    )
  .main-img.radius10(v-else-if='imageBackground', :style='imageBackground')
  .main-img.radius10(v-else, :style='defaultBackground')
  .offer-information
    .d-flex.justify-content-between(v-if='mode != "sold" && mode != "bought" && mode != "setsList"')
      p(v-if='mode != "schemas"')
        | Alcorex
        img.success-icon.ml-1(src='~/assets/images/check_circle.svg', alt='')
      p(v-if='mode === "auctions"') Last Offer
      p(
        v-else-if='kindBut === "sales" || kindBut === "auctions" || kindBut === "all"'
      ) price
      p(v-else-if='mode === "inventory"') Purchase price
      p(v-else-if='mode === "listings"') Listed Price
    .d-flex.justify-content-between(
      v-if='mode === "sold" || mode === "bought" || mode === "setsList"'
    )
      p.default-price {{ cardName }}
      p {{collectionName}}
    .d-flex.justify-content-between(v-if='mode != "sold" && mode != "bought" && mode != "setsList"')
      p.wax-name {{ cardName }}
      p.wax-price(
        v-if='kindBut === "sales" || kindBut === "auctions" || kindBut === "all"'
      )
        | {{ new Intl.NumberFormat().format(waxPrice) }}WAX
    .d-flex.justify-content-between(v-if='mode != "sold" && mode != "bought" && mode != "setsList"')
      p(v-if='mode != "schemas"') Default
      p.default-price(
        v-if='kindBut === "sales" || kindBut === "auctions" || kindBut === "all"'
      )
        | (${{ $systemToUSD(waxPrice) }})
    .mt-2(v-if='mode === "auctions"')
      .d-flex.justify-content-between
        p {{ endsIn }}
        p {{ bidCount }} Bids
    .mt-3(v-if='mode === "listings"')
      .d-flex.justify-content-between
        p Best offer by
        p Last offer
      .d-flex.justify-content-between
        .best-offer.d-flex
          img.success-icon.mr-2(
            v-if='bestOffer',
            src='~/assets/images/MatrixCheems.svg',
            alt=''
          )
          p {{ bestOffer }}
        p.wax-price {{ new Intl.NumberFormat().format(bestPrice) }}WAX
      .d-flex.justify-content-end (${{ $systemToUSD(bestPrice) }})
    .mt-2.sets-list-info(v-if='mode === "setsList"')
      .d-flex.justify-content-between
        p Owns:
          span.ml-1 0
        div(v-if='data.is_transferable')
          img(src='~/assets/images/double_arrow.svg')
          span.ml-2.fs-18 Transferable
      .d-flex.justify-content-between
        p Unboxed:
          span.ml-1 420
        div(v-if='data.is_burnable')
          img(src='~/assets/images/fire.svg')
          span.ml-2.fs-18 Burnable
      p Supply:
        span.ml-1 {{maxSupply + " (" + supply}}
          img.ml-1(src='~/assets/images/fire.svg', alt='')
          span )
  .btn-group.justify-content-between.flex-wrap.w-100(v-if='mode != "sets"')
    button.btn-fill--grey.w-50.mr10.radius6(v-if='mode == "inventory"') Sell NFT
    b-dropdown.btn-fill--green.dropdown-more.radius6.p-0(
      v-if='mode == "inventory"',
      text='More'
    )
      nuxt-link.dropdown-item.d-flex.align-items-center(to='#')
        p.pl-2 Craft
      nuxt-link.dropdown-item.d-flex.align-items-center(to='#')
        p.pl-2 Transfer
      nuxt-link.dropdown-item.d-flex.align-items-center(to='#')
        p.pl-2 New Trade
      nuxt-link.dropdown-item.d-flex.align-items-center(to='#')
        p.pl-2 Create Gift Link
      nuxt-link.dropdown-item.d-flex.align-items-center(to='#')
        p.pl-2 Burn
    b-dropdown.btn-fill--green.dropdown-more.radius6.p-0(
      v-if='mode == "friends"',
      text='More'
    )
      nuxt-link.dropdown-item.d-flex.align-items-center(
        to='/wallet-inventory/trade-offer'
      )
        img.mr-1(src='~/assets/icons/Handshake.svg')
        p Send Trade Offer
      nuxt-link.dropdown-item.d-flex.align-items-center(to='#')
        img.mr-1(src='~/assets/icons/ArrowsLeftRight.svg')
        p Transfer
      nuxt-link.dropdown-item.d-flex.align-items-center(to='#')
        img.mr-1(src='~/assets/icons/Storefront.svg')
        p Seller Page
      nuxt-link.dropdown-item.d-flex.align-items-center(to='#')
        img.mr-1(src='~/assets/icons/UserMinus.svg')
        p Remove Friend
      nuxt-link.dropdown-item.d-flex.align-items-center.block-item(to='#')
        img.mr-1(src='~/assets/icons/SmileyXEyes.svg')
        p Block
    nuxt-link.btn-border--green.w-100.mt-2.radius6.text-white.text-center(
      v-if='mode == "inventory"',
      :to='"/nfts/" + data.asset_id'
    ) Details

    button.btn-border--green.mr10.radius6(v-if='kindBut == "sales"') Details
    button.btn-fill--green.radius6(v-if='kindBut == "sales"') Buy
    button.btn-border--green.mr10.radius6.smaller-btn(
      v-if='kindBut != "sales" && mode != "inventory" && mode != "bought" && mode != "setsList"'
    ) Details
    button.btn-fill--green.bigger-btn.radius6(v-if='kindBut == "auctions"') Make Offer
    button.btn-border--green.w-100.radius6.mb-2(v-if='mode == "bought" || mode === "setsList"') Detail
    button.btn-fill--green.bigger-btn.radius6(
      v-if='kindBut != "sales" && kindBut != "auctions" && mode != "inventory" && mode != "listings" && mode != "auctions" && mode != "sold" && mode != "bought" && mode != "setsList"'
    ) Send Offer
    button.btn-border--green.bigger-btn.radius6(v-if='mode === "setsList"') Inventory
    button.btn-fill--green.radius6(v-if='kindBut == "sales" || mode == "setsList"') Market
    button.btn-fill--green.bigger-btn.radius6(v-if='mode === "sold"') Market
    button.btn-fill--green.bigger-btn.radius6(v-if='mode === "listings"') Buy
    button.btn-fill--green.bigger-btn.radius6(v-if='mode === "auctions"') Make Offer
</template>

<script>
import { BDropdown } from 'bootstrap-vue'
import defaultImg from '~/assets/images/default.png'

export default {
  components: {
    BDropdown
  },
  props: ['data', 'price', 'kindBut', 'mode'],

  data() {
    return {
      search: '',
      defaultBackground: {
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundImage: 'url(' + defaultImg + ')'
      },
      defaultPrice: 0,
      sellOrders: []
    }
  },
  computed: {
    videoBackground() {
      if (this.mode === 'market') {
        if (this.data.assets[0].data.video) {
          return this.data.assets[0].data
        } else return false
      } else if (this.mode === 'templates' || this.mode === 'setsList') {
        if (this.data.immutable_data.video) {
          return this.data.immutable_data
        } else return false
      } else if (this.mode === 'inventory' || this.mode === 'sets') {
        if (this.data.data.video) {
          return this.data.data
        } else return false
      } else if (
        this.mode === 'listings' ||
        this.mode === 'auctions' ||
        this.mode === 'sold' ||
        this.mode === 'bought'
      ) {
        if (this.data.assets && this.data.assets[0].data.video) {
          return this.data.assets[0].data.video
        } else return false
      } else return false
    },
    imageBackground() {
      if (this.mode === 'market') {
        if (this.data.assets[0].data.img) {
          return {
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundImage: this.data.assets[0].data.img.includes('https://')
              ? this.data.assets[0].data.img
              : 'url(https://ipfs.atomichub.io/ipfs/' +
                this.data.assets[0].data.img +
                ')'
          }
        } else return false
      } else if (this.mode === 'inventory' || this.mode === 'sets') {
        if (this.data.data.img) {
          return {
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundImage: this.data.data.img.includes('https://')
              ? this.data.data.img
              : 'url(https://ipfs.atomichub.io/ipfs/' + this.data.data.img + ')'
          }
        } else return false
      } else if (
        this.mode === 'listings' ||
        this.mode === 'auctions' ||
        this.mode === 'sold' ||
        this.mode === 'bought'
      ) {
        if (this.data.assets && this.data.assets[0].data.img) {
          return {
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundImage: this.data.assets[0].data.img.includes('https://')
              ? this.data.assets[0].data.img
              : 'url(https://ipfs.atomichub.io/ipfs/' +
                this.data.assets[0].data.img +
                ')'
          }
        } else return false
      } else if (this.mode === 'assets') {
        if (this.data.data.img) {
          return {
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundImage: this.data.data.img.includes('https://')
              ? this.data.data.img
              : 'url(https://ipfs.atomichub.io/ipfs/' + this.data.data.img + ')'
          }
        } else return false
      } else if (this.mode === 'templates' || this.mode === 'setsList') {
        if (this.data.immutable_data.img) {
          return {
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundImage: this.data.immutable_data.img.includes('https://')
              ? this.data.immutable_data.img
              : 'url(https://ipfs.atomichub.io/ipfs/' +
                this.data.immutable_data.img +
                ')'
          }
        } else return false
      } else if (this.mode === 'schemas') {
        if (this.data.collection.img) {
          return {
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundImage: this.data.collection.img.includes('https://')
              ? this.data.collection.img
              : 'url(https://ipfs.atomichub.io/ipfs/' +
                this.data.collection.img +
                ')'
          }
        } else return false
      } else if (this.data.sell && this.data.sell[0].mdata) {
        return {
          backgroundSize: 'cover',
          backgroundImage: 'url(' + this.data.sell[0].mdata.img + ')'
        }
      } else return false
    },
    mintCount() {
      let string = ''
      if (this.mode === 'market') {
        string = this.data.assets[0].template_mint
      } else if (this.mode === 'assets' || this.mode === 'inventory') {
        string = this.data.template_mint
      } else if (
        this.mode === 'listings' ||
        this.mode === 'auctions' ||
        this.mode === 'sold' ||
        this.mode === 'bought'
      ) {
        string = this.data.assets[0]?.template_mint
      } else string = this.data.id || 0
      if (string.length > 4) {
        return string.substr(0, 1) + '...' + string.substr(-3)
      } else {
        return string
      }
    },
    cardTitle() {
      if (this.mode === 'market') {
        return this.data.seller
      } else if (this.mode === 'assets') {
        return this.data.owner
      } else if (this.mode === 'schemas') {
        return this.data.collection.author
      } else if (this.mode === 'inventory') {
        return this.data.owner
      } else if (
        this.mode === 'listings' ||
        this.mode === 'auctions' ||
        this.mode === 'sold' ||
        this.mode === 'bought'
      ) {
        return this.data.assets[0].owner
      } else return this.data.maker
    },
    bestPrice() {
      if (this.mode === 'listings' || this.mode === 'auctions') {
        if (this.data.price) {
          return (
            this.data.price.amount /
            Math.pow(10, this.data.price.token_precision)
          )
        } else return 0
      }
      return 0
    },
    waxPrice() {
      if (this.mode === 'market') {
        return (
          this.data.price.amount / Math.pow(10, this.data.price.token_precision)
        )
      } else if (this.mode === 'assets') {
        return 0
      } else if (this.mode === 'inventory') {
        if (this.data.prices && this.data.prices[0]) {
          return (
            this.data.prices[0].average /
            Math.pow(10, this.data.prices[0].token.token_precision)
          )
        } else return 0
      } else if (this.mode === 'listings' || this.mode === 'auctions') {
        if (this.data.listing_price) {
          return (
            this.data.listing_price /
            Math.pow(10, this.data.price.token_precision)
          )
        } else return 0
      } else return this.data.buy.quantity.replaceAll('WAX') * 1
    },
    cardName() {
      if (
        this.mode === 'market' ||
        this.mode === 'listings' ||
        this.mode === 'auctions' ||
        this.mode === 'sold' ||
        this.mode === 'bought'
      ) {
        return this.data.assets[0].name
      } else if (
        this.mode === 'assets' ||
        this.mode === 'templates' ||
        this.mode === 'inventory' ||
        this.mode === 'sets' ||
        this.mode === 'setsList'
      ) {
        return this.data.name
      } else if (this.mode === 'schemas') {
        return this.data.collection.name
      }
      return this.data.sell[0].owner
    },
    bestOffer() {
      if (this.mode === 'listings' || this.mode === 'auctions') {
        return this.data.buyer
      }
      return ''
    },
    endsIn() {
      if (this.mode === 'auctions') {
        let timeDiff
        if (new Date(+this.data.end_time) - new Date() > 0) {
          timeDiff =
            Math.floor(
              (new Date(+this.data.end_time) - new Date()) / 86400000
            ) +
            'd ' +
            Math.floor(
              ((new Date(+this.data.end_time) - new Date()) % 86400000) /
                3600000
            ) +
            'h'
        } else timeDiff = '0s'
        return timeDiff
      }
      return ''
    },
    bidCount() {
      if (this.mode === 'auctions') {
        return this.data.bids.length
      }
      return 0
    },
    collectionName() {
      if (this.mode === 'setsList') {
        return this.data.collection.name
      } else return 'Alcorex'
    },
    maxSupply() {
      if (this.mode === 'setsList') {
        return this.data.max_supply
      }
      return 0
    },
    supply() {
      if (this.mode === 'setsList') {
        return this.data.issued_supply
      }
      return 0
    }
  }
}
</script>

<style lang="scss">
.normalcard {
  width: 220px;
  padding: 6px 10px;
  background-color: #202021;
  border-radius: 10px;
  p {
    margin: 0;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
  }
  .sets-list-info {
    p {
      color: #9f979a;
      font-size: 10px;
    }
    span {
      font-size: 10px;
      color: white;
    }
  }
  header {
    white-space: nowrap;
  }

  .offer-information {
    margin: 6px 0;
  }

  .card_number {
    padding: 0 3px;
    border-radius: 3px;
    height: 22px;
    background-color: #000;
  }
  .offer-information .success-icon {
    width: 10px;
    height: 10px;
  }

  .radius10 {
    border-radius: 10px !important;
  }

  .radius6 {
    border-radius: 6px !important;
  }

  .mr10 {
    margin-right: 10px !important;
  }

  .wax-name {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .btn-border--green {
    height: 33px;
    color: #fff;
    background-color: #161617;
    border: 1px solid var(--main-action-green);
    font-size: 14px;
    padding: 5px 10px;
    font-weight: 400;
  }

  .btn-border--green:hover {
    background-color: transparent;
    color: var(--main-action-green);
  }

  .full-btn {
    width: 100%;
  }

  .btn-fill--green {
    color: #000;
    width: 82px;
    height: 33px;
    background-color: var(--main-action-green);
    border: 1px solid var(--main-action-green);
    font-size: 14px;
    font-weight: 400;
    padding: 5px 10px;
    :hover {
      background-color: transparent;
      color: var(--main-action-green);
    }
  }
  .dropdown-more {
    .dropdown-toggle {
      display: flex;
      align-items: center;
      background-color: transparent !important;
      border: 0;
      box-shadow: none !important;
      color: #000 !important;
      &::after {
        margin-left: 10px;
        margin-top: 2px;
      }
    }
    &:hover {
      background-color: var(--main-action-green);
      border: 1px solid var(--main-action-green);
    }
    .dropdown-menu {
      width: 130px;
      background-color: var(--btn-default);
      padding: 0;
      .dropdown-item {
        padding: 5px 7px;
        color: #fff !important;
        font-size: 12px;
        p {
          color: #fff;
        }
        &:hover {
          background-color: #3c3c43;
        }
        &:not(.dropdown-item:last-child) {
          border-bottom: 1px solid #3c3c43;
        }
        &.block-item {
          color: #ff7262 !important;
          p {
            color: #ff7262;
          }
        }
      }
    }
  }
  .btn-fill--grey {
    color: #fff;
    height: 33px;
    background-color: var(--btn-default);
    border: 1px solid transparent;
    font-size: 14px;
    font-weight: 400;
    padding: 5px 10px;
    &:hover {
      background-color: transparent;
      border-color: var(--btn-default);
    }
  }

  .smaller-btn {
    width: 83px;
  }

  .bigger-btn {
    width: 107px;
  }

  .main-img {
    width: 200px;
    height: 229.9px;
    object-fit: cover;
  }

  .wax-price {
    color: #f89022;
  }

  .default-price,
  .best-offer {
    color: var(--main-action-green);
  }

  @media only screen and (max-width: 600px) {
    .market-cards .item {
      width: 100%;
    }
  }
}
</style>
