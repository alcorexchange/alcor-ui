<template lang="pug">
.normalcard.radius10
  header.d-flex.justify-content-between.mb-1(v-if='mode != "templates"')
    div
      img(src='~/assets/images/small_shape.svg')
      span.card-title {{ cardTitle }}
    .d-flex.align-items-center(v-if='mode != "schemas"')
      img.ml-1(src='~/assets/images/double_arrow.svg', alt='')
      img.ml-1(src='~/assets/images/fire.svg', alt='')
      .card_number.d-flex.align-items-center.ml-1 {{ "#" + mintCount }}
  video.main-img.radius10(v-if='videoBackground', autoplay='', loop='')
    source(
      :src='"https://ipfs.atomichub.io/ipfs/" + videoBackground.video',
      type='video/mp4'
    )
  .main-img.radius10(v-else-if='imageBackground', :style='imageBackground')
  .main-img.radius10(v-else, :style='defaultBackground')
  .offer-information
    .d-flex.justify-content-between
      p(v-if='mode != "schemas"')
        | Alcorex
        img.success-icon.ml-1(src='~/assets/images/check_circle.svg', alt='')
      p(
        v-if='kindBut === "sales" || kindBut === "auctions" || kindBut === "all"'
      ) price
      p(v-else-if='mode === "inventory"') Purchase price
    .d-flex.justify-content-between
      p.wax-name {{ cardName }}
      p.wax-price(
        v-if='kindBut === "sales" || kindBut === "auctions" || kindBut === "all"'
      )
        | {{ new Intl.NumberFormat().format(waxPrice) }}WAX
    .d-flex.justify-content-between
      p(v-if='mode != "schemas"') Default
      p.default-price(
        v-if='kindBut === "sales" || kindBut === "auctions" || kindBut === "all"'
      )
        | (${{ $systemToUSD(waxPrice) }})
  .btn-group.justify-content-between.flex-wrap
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
      v-if='kindBut != "sales" && mode != "inventory"'
    ) Details
    button.btn-fill--green.bigger-btn.radius6(v-if='kindBut == "auctions"') Make Offer
    button.btn-fill--green.bigger-btn.radius6(
      v-if='kindBut != "sales" && kindBut != "auctions" && mode != "inventory"'
    ) Send Offer
</template>

<script>
import { BDropdown } from 'bootstrap-vue'
import defaultImg from '~/assets/images/default.png'

export default {
  components: {
    BDropdown,
  },
  props: ['data', 'price', 'kindBut', 'mode'],

  data() {
    return {
      search: '',
      defaultBackground: {
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundImage: 'url(' + defaultImg + ')',
      },
      defaultPrice: 0,
      sellOrders: [],
    }
  },
  computed: {
    videoBackground() {
      if (this.mode === 'market') {
        if (this.data.assets[0].data.video) {
          return this.data.assets[0].data
        } else return false
      } else if (this.mode === 'templates') {
        if (this.data.immutable_data.video) {
          return this.data.immutable_data
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
                ')',
          }
        } else return false
      } else if (this.mode === 'inventory') {
        if (this.data.data.img) {
          return {
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundImage: this.data.data.img.includes('https://')
              ? this.data.data.img
              : 'url(https://ipfs.atomichub.io/ipfs/' + this.data.data.img + ')',
          }
        } else return false
      } else if (this.mode === 'assets') {
        if (this.data.data.img) {
          return {
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundImage: this.data.data.img.includes('https://')
              ? this.data.data.img
              : 'url(https://ipfs.atomichub.io/ipfs/' + this.data.data.img + ')',
          }
        } else return false
      } else if (this.mode === 'templates') {
        if (this.data.immutable_data.img) {
          return {
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundImage: this.data.immutable_data.img.includes('https://')
              ? this.data.immutable_data.img
              : 'url(https://ipfs.atomichub.io/ipfs/' +
                this.data.immutable_data.img +
                ')',
          }
        } else return false
      } else if (this.mode === 'schemas') {
        if (this.data.collection.img) {
          return {
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundImage: this.data.collection.img.includes('https://')
              ? this.data.collection.img
              : 'url(https://ipfs.atomichub.io/ipfs/' + this.data.collection.img + ')',
          }
        } else return false
      } else if (this.data.sell && this.data.sell[0].mdata) {
        return {
          backgroundSize: 'cover',
          backgroundImage: 'url(' + this.data.sell[0].mdata.img + ')',
        }
      } else return false
    },
    mintCount() {
      let string = ''
      if (this.mode === 'market') {
        string = this.data.assets[0].template_mint
      } else if (this.mode === 'assets' || this.mode === 'inventory') {
        string = this.data.template_mint
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
      } else return this.data.maker
    },
    waxPrice() {
      if (this.mode === 'market') {
        return this.data.price.amount / (10 * this.data.price.token_precision)
      } else if (this.mode === 'assets') {
        return 0
      } else if (this.mode === 'inventory') {
        if (this.data.prices && this.data.prices[0]) {
          return (
            this.data.prices[0].average /
            (10 * this.data.prices[0].token.token_precision)
          )
        } else return 0
      } else return this.data.buy.quantity.replaceAll('WAX') * 1
    },
    cardName() {
      if (this.mode === 'market') {
        return this.data.assets[0].name
      } else if (
        this.mode === 'assets' ||
        this.mode === 'templates' ||
        this.mode === 'inventory'
      ) {
        return this.data.name
      } else if (this.mode === 'schemas') {
        return this.data.collection.name
      }
      return this.data.sell[0].owner
    },
  },
}
</script>

<style lang="scss">
.normalcard {
  width: 220px;
  padding: 6px 10px;
  background-color: #202021;
  p {
    margin: 0;
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

  .default-price {
    color: var(--main-action-green);
  }

  @media only screen and (max-width: 600px) {
    .market-cards .item {
      width: 100%;
    }
  }
}
</style>
