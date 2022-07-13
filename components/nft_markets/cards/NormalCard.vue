<template lang='pug'>
div(
  :class='["normalcard", "radius10", mode === "assetsInventory" && cardState === "disable" ? "grey-mode" : mode === "sets" ? "middle-width" : ""]'
)
  el-popover(
    placement='right',
    trigger='hover',
    :disabled='!(mode === "inventory" || mode === "templates" || mode === "assets" || mode === "market-sales" || mode === "market-auctions" || mode === "setsList" || mode === "listings" || this.mode === "sold" || this.mode === "auctions" || this.mode === "bought")',
    :openDelay='500'
  )
    .popover-panel
      .popover__top-panel.d-flex
        video(
          :class='["main-img", "radius10", mode === "setsList" ? "sets-list-mode" : ""]',
          v-if='videoBackground',
          autoplay='true',
          loop='true'
        )
          source(
            :src='"https://resizer.atomichub.io/videos/v1/preview?ipfs=" + videoBackground.video + "&size=370&output=mp4"',
            type='video/mp4'
          )
        div(
          :class='["main-img", "radius10", mode === "setsList" || mode === "templates" ? "sets-list-mode" : ""]',
          v-else-if='imageBackground',
          :style='imageBackground'
        )
        div(
          :class='["main-img", "radius10", mode === "setsList" || mode === "templates" ? "sets-list-mode" : ""]',
          v-else,
          :style='defaultBackground'
        )
        .popover__top-right-panel
          h4.popover-title.mt-0.mb-2(
            v-if='mode !== "setsList" && mode !== "templates"'
          ) {{ cardName }}
          h4.popover-title.mt-0.mb-2(
            v-if='mode === "setsList" || mode === "templates"'
          ) Template ID:
            p.green-text.mt-1 {{ "#" + assetId }}
          p.popover-id(v-if='mode !== "setsList" && mode !== "templates"') ID:
            span.ml-1 {{ "#" + assetId }}
          p.popover-collection Collection:
            span.ml-1.green-text {{ collectionName }}
          p.popover-schema Schema:
            span.ml-1.green-text {{ schemaName }}
          p.popover-mint(v-if='mode !== "setsList" && mode !== "templates"') Mint:
            span.ml-1 {{ mintCount + " - " + supply + " (max: " + maxSupply + ") - " + (overData ? overData.templateStats.burned : 0) }}
          p.popover-owner(v-if='mode !== "setsList" && mode !== "templates"') Owner:
            span.ml-1.green-text {{ owner }}
          p.popover-backed-token(
            v-if='mode !== "setsList" && mode !== "templates"'
          ) Backed Tokens:
            span.ml-1 {{ backedToken }}
          p.popover-lowest-listing(
            v-if='mode !== "setsList" && mode !== "templates"'
          ) Lowest Listing:
            span.ml-1.gold-text {{ new Intl.NumberFormat().format(lowestListing) }}WAX
            span.usd-price.green-text (${{ $systemToUSD(lowestListing) }})
          p.popover-highest-listing(
            v-if='mode !== "setsList" && mode !== "templates"'
          ) Highest Listing:
            span.ml-1.gold-text {{ new Intl.NumberFormat().format(highestListing) }}WAX
            span.usd-price.green-text (${{ $systemToUSD(highestListing) }})
          p.popover-issued-supply(
            v-if='mode === "setsList" || mode === "templates"'
          ) Issued Supply:
            span.ml-1 {{ supply + " (Max: " + maxSupply + ")" }}
      .popover__bottom-panel
        .d-flex(v-for='(item, index) in detailData', :key='index')
          p.popover__bottom-label {{ item.key + ":" }}
          p.popover__bottom-text {{ item.data }}
    div(slot='reference', @mouseover='handleOverData')
      header.d-flex.justify-content-between.mb-1(
        v-if='mode !== "templates" && mode !== "sets" && mode !== "setsList" && mode !== "sets"'
      )
        div
          img(src='~/assets/images/small_shape.svg')
          span.card-title {{ cardTitle }}
        .d-flex.align-items-center(v-if='mode !== "schemas"')
          img.ml-1(src='~/assets/images/double_arrow.svg', alt='')
          img.ml-1(src='~/assets/images/fire.svg', alt='')
          .card_number.d-flex.align-items-center.ml-1 {{ "#" + mintCount }}
      video.main-img.radius10(
        v-if='videoBackground',
        autoplay='true',
        loop='true'
      )
        source(
          :src='"https://resizer.atomichub.io/videos/v1/preview?ipfs=" + videoBackground.video + "&size=370&output=mp4"',
          type='video/mp4'
        )
      .main-img.radius10(v-else-if='imageBackground', :style='imageBackground')
      .main-img.radius10(v-else, :style='defaultBackground')
      .offer-information(v-if='mode === "sets"')
        p.wax-name.text-center.mt-3.text-green {{ cardName }}
      .offer-information(v-else)
        .d-flex.justify-content-between(
          v-if='mode !== "sold" && mode !== "bought" && mode !== "setsList"'
        )
          p(v-if='mode !== "schemas"')
            | Alcorex
            img.success-icon.ml-1(
              src='~/assets/images/check_circle.svg',
              alt=''
            )
          p(v-if='mode === "auctions"') Last Offer
          p(
            v-else-if='mode === "market-sales" || mode === "market-auctions" || mode === "setList" || mode === "listings" || mode === "auctions" || mode === "sold" || mode === "bought"'
          ) price
          p(v-else-if='mode === "inventory"') Purchase price
          p(v-else-if='mode === "listings"') Listed Price
        .d-flex.justify-content-between(
          v-if='mode === "sold" || mode === "bought" || mode === "setsList" || mode === "assetsInventory"'
        )
          p.default-price {{ cardName }}
          p {{ collectionName }}
        .d-flex.justify-content-between(
          v-if='mode !== "sold" && mode !== "bought" && mode !== "setsList" && mode !== "assetsInventory"'
        )
          p.wax-name {{ cardName }}
          p.wax-price(
            v-if='mode === "market-sales" || mode === "market-auctions" || mode === "setList" || mode === "listings" || mode === "auctions" || mode === "sold" || mode === "bought"'
          )
            | {{ new Intl.NumberFormat().format(waxPrice) }}WAX
        .d-flex.justify-content-between(
          v-if='mode !== "sold" && mode !== "bought" && mode !== "setsList" && mode !== "assetsInventory"'
        )
          p(v-if='mode !== "schemas"') Default
          p.default-price(
            v-if='mode === "market-sales" || mode === "market-auctions" || mode === "setList" || mode === "listings" || mode === "auctions" || mode === "sold" || mode === "bought"'
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
            span.ml-1 {{ maxSupply + " (" + supply }}
              img.ml-1(src='~/assets/images/fire.svg', alt='')
              span )
  .btn-group.justify-content-between.flex-wrap.w-100
    button.btn-fill--grey.w-50.mr10.radius6(v-if='mode === "inventory"') Sell NFT
    el-dropdown.btn-fill--green.dropdown-more.radius6.p-0.d-flex.justify-content-center.align-items-center(
      trigger='click',
      v-if='mode === "inventory"'
    )
      span.el-dropdown-link
        span More
        i.el-icon-arrow-down.el-icon--right
      el-dropdown-menu(slot='dropdown')
        nuxt-link.dropdown-item.d-flex.align-items-center(
          to='/wallet-inventory/trade-offer'
        )
          .d-flex.align-items-center
            img(src='~/assets/images/SendOffer.svg')
            p.mb-0 Send Trade Offer
        nuxt-link.dropdown-item.d-flex.align-items-center(
          :to='/transfer/ + data.asset_id'
        )
          .d-flex.align-items-center
            img(src='~/assets/images/Transfer.svg')
            p.mb-0 Transfer
        nuxt-link.dropdown-item.d-flex.align-items-center(to='#')
          .d-flex.align-items-center
            img(src='~/assets/images/GiftLink.svg')
            p.mb-0 Create Gift Link
        nuxt-link.dropdown-item.d-flex.align-items-center(to='#')
          .d-flex.align-items-center
            img(src='~/assets/images/Burn.svg')
            p.mb-0 Burn
    el-dropdown.btn-fill--green.dropdown-more.radius6.p-0.d-flex.justify-content-center.align-items-center(
      trigger='click',
      v-if='mode === "friends"'
    )
      span.el-dropdown-link
        span More
        i.el-icon-arrow-down.el-icon--right
      span
      el-dropdown-menu(slot='dropdown')
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
      v-if='mode === "inventory"',
      :to='"/nfts/" + data.asset_id'
    ) Details
    nuxt-link.btn-border--green.w-100.radius6.mb-2.text-white.text-center(
      v-if='mode === "bought"',
      :to='"/nfts/" + data.assets[0].asset_id'
    ) Detail
    nuxt-link.btn-border--green.mr10.radius6.smaller-btn.text-white.text-center(
      v-if='mode === "listings" || mode === "auctions" || mode === "sold" || mode === "market-sales" || mode === "market-auctions"',
      :to='"/nfts/" + data.assets[0].asset_id'
    ) Detail
    nuxt-link.btn-border--green.w-100.radius6.text-white.text-center(
      v-if='mode === "sets"',
      :to='"#sets-" + data.collection_name'
    ) View Set
    //below for the static button that should be removed
    button.btn-border--green.mr10.radius6.smaller-btn(
      v-if='mode !== "market-auctions" && mode !== "market-sales" && mode !== "inventory" && mode !== "listings" && mode !== "auctions" && mode !== "sold" && mode !== "bought" && mode !== "setsList" && mode !== "assetsInventory" && mode !== "sets"'
    ) Details
    button.btn-fill--green.bigger-btn.radius6(
      v-if='mode === "market-sales"',
      @click='handleBuy'
    ) Buy
    button.btn-fill--green.bigger-btn.radius6(
      v-if='mode === "market-auctions"'
    ) Make Offer
    button.btn-border--green.w-100.radius6.mb-2(
      v-if='mode === "setsList"',
      @click='debug'
    ) Detail
    button.btn-fill--green.bigger-btn.radius6(
      v-if='mode !== "market-sales" && mode !== "market-auctions" && mode !== "inventory" && mode !== "listings" && mode !== "auctions" && mode !== "sold" && mode !== "bought" && mode !== "setsList" && mode !== "setsList" && mode !== "assetsInventory" && mode !== "sets"'
    ) Send Offer
    button.btn-border--green.bigger-btn.radius6(v-if='mode === "setsList"') Inventory
    button.btn-fill--green.radius6(v-if='mode === "setsList"') Market
    button.btn-fill--green.bigger-btn.radius6(v-if='mode === "sold"') Market
    button.btn-fill--green.bigger-btn.radius6(v-if='mode === "listings"') Buy
    button.btn-fill--green.bigger-btn.radius6(v-if='mode === "auctions"') Make Offer
    button.btn-border--green.bigger-btn.radius6(
      v-if='mode === "assetsInventory"'
    ) Details
    button.btn-fill--green.smaller-btn.radius6(
      v-if='mode === "assetsInventory"',
      @click='() => addTrade(data)'
    ) Add
</template>

<script>
import defaultImg from '~/assets/images/default.png'

export default {
  props: [
    'data',
    'price',
    'mode',
    'addTrade',
    'cardState',
    'getOverData',
    'overData',
    'handleBuyAction',
  ],

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
      if (this.mode === 'market-sales' || this.mode === 'market-auctions') {
        if (this.data.assets[0].data.video) {
          return this.data.assets[0].data
        } else return false
      } else if (this.mode === 'templates' || this.mode === 'setsList') {
        if (this.data.immutable_data.video) {
          return this.data.immutable_data
        } else return false
      } else if (
        this.mode === 'inventory' ||
        this.mode === 'sets' ||
        this.mode === 'assetsInventory'
      ) {
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
      if (this.mode === 'market-sales' || this.mode === 'market-auctions') {
        if (this.data.assets[0].data.img) {
          return {
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundImage: this.data.assets[0].data.img.includes('https://')
              ? this.data.assets[0].data.img
              : 'url(https://resizer.atomichub.io/images/v1/preview?ipfs=' +
                this.data.assets[0].data.img +
                '&size=370)',
          }
        } else return false
      } else if (
        this.mode === 'inventory' ||
        this.mode === 'sets' ||
        this.mode === 'assetsInventory'
      ) {
        if (this.data.data.img) {
          return {
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundImage: this.data.data.img.includes('https://')
              ? this.data.data.img
              : 'url(https://resizer.atomichub.io/images/v1/preview?ipfs=' +
                this.data.data.img +
                '&size=370)',
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
              : 'url(https://resizer.atomichub.io/images/v1/preview?ipfs=' +
                this.data.assets[0].data.img +
                '&size=370)',
          }
        } else return false
      } else if (this.mode === 'assets') {
        if (this.data.data.img) {
          return {
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundImage: this.data.data.img.includes('https://')
              ? this.data.data.img
              : 'url(https://resizer.atomichub.io/images/v1/preview?ipfs=' +
                this.data.data.img +
                '&size=370)',
          }
        } else return false
      } else if (this.mode === 'templates' || this.mode === 'setsList') {
        if (this.data.immutable_data.img) {
          return {
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundImage: this.data.immutable_data.img.includes('https://')
              ? 'url(' + this.data.immutable_data.img + ')'
              : 'url(https://resizer.atomichub.io/images/v1/preview?ipfs=' +
                this.data.immutable_data.img +
                '&size=370)',
          }
        } else return false
      } else if (this.mode === 'schemas') {
        if (this.data.collection.img) {
          return {
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundImage: this.data.collection.img.includes('https://')
              ? this.data.collection.img
              : 'url(https://resizer.atomichub.io/images/v1/preview?ipfs=' +
                this.data.collection.img +
                '&size=370)',
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
      if (
        this.mode === 'market-sales' ||
        this.mode === 'market-auctions' ||
        this.mode === 'listings' ||
        this.mode === 'bought' ||
        this.mode === 'auctions' ||
        this.mode === 'sold'
      ) {
        string = this.data.assets[0].template_mint || 0
      } else if (
        this.mode === 'assets' ||
        this.mode === 'inventory' ||
        this.mode === 'assetsInventory'
      ) {
        string = this.data.template_mint || 0
      } else string = this.data.id || 0
      if (string.length > 4) {
        return string.substr(0, 1) + '...' + string.substr(-3)
      } else {
        return string
      }
    },
    cardTitle() {
      if (this.mode === 'market-sales' || this.mode === 'market-auctions') {
        return this.data.seller
      } else if (
        this.mode === 'assets' ||
        this.mode === 'inventory' ||
        this.mode === 'assetsInventory'
      ) {
        return this.data.owner
      } else if (this.mode === 'schemas') {
        return this.data.collection.author
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
      if (this.mode === 'market-sales' || this.mode === 'market-auctions') {
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
      } else if (
        this.mode === 'listings' ||
        this.mode === 'bought' ||
        this.mode === 'auctions' ||
        this.mode === 'sold'
      ) {
        if (this.data.listing_price) {
          return (
            this.data.listing_price /
            Math.pow(10, this.data.price.token_precision)
          )
        } else return 0
      } else return this.data.buy.quantity.replaceAll('WAX') * 1
    },
    lowestListing() {
      if (this.overData && this.overData.saleData[0]) {
        return this.overData.saleData[0].listing_price / Math.pow(10, 8)
      }
      return 0
    },
    highestListing() {
      if (this.mode === 'inventory' || this.mode === 'assets') {
        if (this.data.prices && this.data.prices[0]) {
          return (
            this.data.prices[0].max /
            Math.pow(10, this.data.prices[0].token.token_precision)
          )
        }
        return 0
      } else if (
        this.mode === 'listings' ||
        this.mode === 'market-sales' ||
        this.mode === 'market-auctions' ||
        this.mode === 'bought' ||
        this.mode === 'sold' ||
        this.mode === 'auctions'
      ) {
        if (this.data.assets[0].prices && this.data.assets[0].prices[0]) {
          return (
            this.data.assets[0].prices[0].max /
            Math.pow(10, this.data.assets[0].prices[0].token.token_precision)
          )
        }
        return 0
      }
      return 0
    },
    cardName() {
      if (
        this.mode === 'market-sales' ||
        this.mode === 'market-auctions' ||
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
        this.mode === 'assetsInventory' ||
        this.mode === 'sets' ||
        this.mode === 'setsList'
      ) {
        return this.data.name
      } else if (this.mode === 'schemas') {
        return this.data.collection.name
      } else if (this.data.sell[0].owner) {
        return this.data.sell[0].owner
      } else return 'None'
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
      if (
        this.mode === 'setsList' ||
        this.mode === 'assets' ||
        this.mode === 'market-sales' ||
        this.mode === 'market-auctions' ||
        this.mode === 'inventory' ||
        this.mode === 'bought' ||
        this.mode === 'listings' ||
        this.mode === 'sold' ||
        this.mode === 'auctions'
      ) {
        return this.data.collection.name
      } else if (this.mode === 'assetsInventory') {
        return this.data.contract
      } else return 'Alcorex'
    },
    schemaName() {
      if (
        this.mode === 'inventory' ||
        this.mode === 'assets' ||
        this.mode === 'setsList' ||
        this.mode === 'templates' ||
        this.mode === 'assets'
      ) {
        return this.data.schema.schema_name
      } else if (
        this.mode === 'listings' ||
        this.mode === 'market-sales' ||
        this.mode === 'market-auctions' ||
        this.mode === 'bought' ||
        this.mode === 'sold' ||
        this.mode === 'auctions'
      ) {
        return this.data.assets[0].schema.schema_name
      } else return 'Alcorex'
    },
    maxSupply() {
      if (this.mode === 'setsList' || this.mode === 'templates') {
        return this.data.max_supply
      } else if (this.mode === 'inventory' || this.mode === 'assets') {
        return this.data.template.max_supply
      } else if (
        this.mode === 'listings' ||
        this.mode === 'market-sales' ||
        this.mode === 'market-auctions' ||
        this.mode === 'bought' ||
        this.mode === 'sold' ||
        this.mode === 'auctions'
      ) {
        if (this.data.assets[0].template) {
          return this.data.assets[0].template.max_supply
        }
        return 0
      }
      return 0
    },
    supply() {
      if (this.mode === 'setsList' || this.mode === 'templates') {
        return this.data.issued_supply
      } else if (this.mode === 'inventory' || this.mode === 'assets') {
        return this.data.template.issued_supply
      } else if (
        this.mode === 'listings' ||
        this.mode === 'market-sales' ||
        this.mode === 'market-auctions' ||
        this.mode === 'bought' ||
        this.mode === 'sold' ||
        this.mode === 'auctions'
      ) {
        if (this.data.assets[0].template) {
          return this.data.assets[0].template.issued_supply
        }
        return 0
      }
      return 0
    },
    assetId() {
      if (this.mode === 'inventory' || this.mode === 'assets') {
        return this.data.asset_id
      } else if (
        this.mode === 'listings' ||
        this.mode === 'market-sales' ||
        this.mode === 'market-auctions' ||
        this.mode === 'bought' ||
        this.mode === 'sold' ||
        this.mode === 'auctions'
      ) {
        return this.data.assets[0].asset_id
      } else if (this.mode === 'setsList' || this.mode === 'templates') {
        return this.data.template_id
      }
      return 0
    },
    owner() {
      if (this.mode === 'inventory' || this.mode === 'assets') {
        return this.data.owner
      } else if (
        this.mode === 'listings' ||
        this.mode === 'market-sales' ||
        this.mode === 'market-auctions' ||
        this.mode === 'bought' ||
        this.mode === 'sold' ||
        this.mode === 'auctions'
      ) {
        return this.data.assets[0].owner
      }
      return ''
    },
    backedToken() {
      if (this.mode === 'inventory' || this.mode === 'assets') {
        if (this.data.backed_tokens.length) {
          return this.data.backed_tokens.join()
        } else return 'None'
      } else if (
        this.mode === 'listings' ||
        this.mode === 'market-sales' ||
        this.mode === 'market-auctions' ||
        this.mode === 'bought' ||
        this.mode === 'sold' ||
        this.mode === 'auctions'
      ) {
        if (this.data.assets[0].backed_tokens.length) {
          return this.data.assets[0].backed_tokens.join()
        } else return 'None'
      }
      return 'None'
    },
    detailData() {
      if (this.mode === 'inventory' || this.mode === 'assets') {
        if (this.data) {
          const arr = []
          Object.keys(this.data.data).map((item) => {
            if (item !== 'img' && item !== 'name') {
              arr.push({ key: item, data: this.data.data[item] })
            }
          })
          return arr
        }
        return []
      } else if (
        this.mode === 'listings' ||
        this.mode === 'market-sales' ||
        this.mode === 'market-auctions' ||
        this.mode === 'bought' ||
        this.mode === 'sold' ||
        this.mode === 'auctions'
      ) {
        if (this.data.assets[0]) {
          const arr = []
          Object.keys(this.data.assets[0].data).map((item) => {
            if (item !== 'img' && item !== 'name') {
              arr.push({ key: item, data: this.data.assets[0].data[item] })
            }
          })
          return arr
        }
        return []
      } else if (this.mode === 'setsList' || this.mode === 'templates') {
        if (this.data.immutable_data) {
          const arr = []
          Object.keys(this.data.immutable_data).map((item) => {
            arr.push({ key: item, data: this.data.immutable_data[item] })
          })
          return arr
        }
        return []
      }
      return []
    },
  },
  methods: {
    handleOverData() {
      setTimeout(() => {
        if (this.mode === 'inventory' || this.mode === 'assets') {
          const params = {
            template_id: this.data.template.template_id,
            collection_name: this.data.collection.collection_name,
            asset_id: this.data.asset_id,
          }
          this.getOverData(params)
        } else if (
          this.mode === 'listings' ||
          this.mode === 'market-sales' ||
          this.mode === 'market-auctions' ||
          this.mode === 'sold' ||
          this.mode === 'auctions' ||
          this.mode === 'bought'
        ) {
          const params = {
            template_id: this.data.assets[0].template.template_id,
            collection_name: this.data.assets[0].collection.collection_name,
            asset_id: this.data.assets[0].asset_id,
          }
          this.getOverData(params)
        }
      }, 500)
    },
    handleBuy() {
      if (this.mode === 'market-sales') {
        const params = {
          template_id: this.data.assets[0].template.template_id,
          collection_name: this.data.assets[0].collection.collection_name,
          asset_id: this.data.assets[0].asset_id,
        }
        this.handleBuyAction(params)
      }
    },
  },
}
</script>

<style lang='scss'>
.el-dropdown-menu {
  width: 130px;
  padding: 0 !important;
  border: 1px solid rgba(60, 60, 67, 0.36) !important;

  .popper__arrow {
    display: none !important;
  }

  .dropdown-item {
    height: 30px;
    padding: 0 8px;

    &:not(.dropdown-item:last-of-type) {
      border-bottom: 1px solid rgba(60, 60, 67, 0.36);
    }

    &:hover {
      background-color: #3c3c43;
    }

    p {
      font-size: 12px;
      color: #ffffff;
      margin-left: 8px;
    }
  }
}

.normalcard {
  &.grey-mode {
    filter: grayscale(1);
  }

  .text-green {
    color: #67c23a;
  }

  width: 220px;
  padding: 6px 10px;
  background-color: #202021;
  border-radius: 10px;

  &.middle-width {
    width: 304px;

    .main-img {
      width: 100%;
      height: 280px;
    }
  }

  .el-dropdown-link {
    color: #000;

    &:hover {
      * {
        color: #000 !important;
      }
    }
  }

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

    &.sets-list-mode {
      width: 150px;
      height: 150px;
    }
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

.el-popover.el-popper {
  background: transparent;
  padding: 0;
}

.popover-panel {
  max-height: 95vh;
  width: 450px;
  border-radius: 10px;
  background-color: #282828;
  border: 1px solid #333333;
  box-shadow: 0px 4px 16px rgba(0, 0, 0, 0.25);
  padding: 16px;
  overflow-y: auto;

  .popover__top-panel {
    .main-img {
      min-width: 156px;
      height: 156px;
    }

    .popover__top-right-panel {
      margin-left: 16px;

      .popover-title {
        color: #67c23a;
        font-size: 24px;
        font-weight: 500;
        line-height: 28px;
        margin-bottom: 24px;
      }

      p {
        font-size: 14px;
        font-weight: 500;
        line-height: 16.41px;
        color: #f2f2f2;

        span {
          font-weight: 400;

          &.green-text {
            color: #67c23a;
          }

          &.gold-text {
            color: #cf9236;
          }
        }
      }
    }
  }

  .popover__bottom-panel {
    .popover__bottom-label {
      min-width: 156px;
      max-width: 156px;
      margin-right: 16px;
    }

    p {
      font-size: 14px;
      font-weight: 500;
      line-height: 16px;
      color: #f2f2f2;

      &.popover__bottom-label {
        font-weight: 500;
      }
    }
  }
}
</style>
