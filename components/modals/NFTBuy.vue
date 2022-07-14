<template lang="pug">
el-dialog.nft-modal-container(:visible='is_modal')
  i.el-icon-close(@click='toggleModal')
  .nft-modal
    .row
      .d-flex.justify-content-center.align-items-center.w-100
        .col-5
          TradeOfferCard(
            :data='{ maker: "gchad.wam", id: "50", nobtngroup: true}',
            :mint='getSeller',
            :mintCount='getMintCount',
            :imageBackground='imageBackground',
            :videoBackground='videoBackground',
            :mode='mode',
            price=0
          )
        .col-7.mt-5
          .nft-info
            h5 Summary
            .d-flex.justify-content-between.w-100
              .w-50
                p.text-white Sale ID
                p.text-white Collection
                p.text-white NFT ID
                p.text-white Mint Number
                p.text-white Backed tokens
                p.text-white Seller
                p.text-white Price
              .w-50
                p.text-white {{ "#" + saleId }}
                p.text-white {{ collectionName }}
                p.text-white {{ "#" + assetId }}
                p.text-white {{ mintCount + " - " + supply + " (max: " + maxSupply + ") - " + (overData ? overData.templateStats.burned : 0) }}
                p.text-white Backed tokens
                p.text-white Seller
                p.text-white Price
            .d-flex.align-items-start
              el-checkbox.pr-2.pb-2
              span I understand that this NFT is not whitelisted/verified and I made sure the collection is not a fake of another collection.
            .buy-nft-btn.text-center(@click='buyNFT') Buy NFT
            .make-offer.text-center.mt-3.text-decoration-underline(@click='makeOffer') Make Offer
</template>

<script>
import TradeOfferCard from '~/components/nft_markets/cards/TradeOfferCard'
import defaultImg from '~/assets/images/default.png'

export default {
  components: { TradeOfferCard },
  props: ['show_modal', 'handleCloseModal', 'mode', 'data', 'overData'],
  data() {
    return {
      search: '',
      defaultBackground: {
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundImage: 'url(' + defaultImg + ')',
      },
      defaultPrice: 0,
    }
  },
  computed: {
    is_modal() {
      return this.show_modal
    },
    getSeller() {
      return this.data ? this.data[0].seller : ''
    },
    getMintCount() {
      return this.data ? this.data[0].assets[0].template_mint : 0
    },
    videoBackground() {
      if (this.mode === 'market-sales' || this.mode === 'market-auctions') {
        if (this.data && this.data[0].assets[0] && this.data[0].assets[0].data.video) {
          return this.data[0].assets[0].data
        } else return false
      } else return false
    },
    imageBackground() {
      if (this.mode === 'market-sales' || this.mode === 'market-auctions') {
        if (this.data && this.data[0].assets[0]) {
          return {
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundImage: this.data[0].assets[0].data.img?.includes('https://')
              ? this.data[0].assets[0].data.img
              : 'url(https://resizer.atomichub.io/images/v1/preview?ipfs=' +
                this.data[0].assets[0].data.img +
                '&size=370)',
          }
        } return false
      }
      return false
    },
    saleId() {
      return this.data == null ? 0 : this.data[0].sale_id
    },
    collectionName() {
      return this.data == null ? 'Alcorex' : this.data[0].collection_name
    },
    assetId() {
      return this.data != null && this.data[0].assets[0] != null
        ? this.data[0].assets[0].asset_id
        : 0
    },
    mintCount() {
      let string = ''
      if (this.mode === 'market-sales' || this.mode === 'market-auctions') {
        string =
          this.data != null && this.data[0].assets[0] != null
            ? this.data[0].assets[0].template_mint
            : ''
      }
      if (string.length > 7) {
        return string.substr(0, 1) + '...' + string.substr(-3)
      } else {
        return string
      }
    },
    supply() {
      if (this.mode === 'market-sales' || this.mode === 'market-auctions') {
        return this.data != null && this.data[0].assets[0] != null
          ? this.data[0].assets[0].template.issued_supply
          : 0
      }
      return 0
    },
    maxSupply() {
      if (this.mode === 'market-sales' || this.mode === 'market-auctions') {
        return this.data != null && this.data[0].assets[0] != null
          ? this.data[0].assets[0].template.issued_supply
          : 0
      }
      return 0
    },
  },
  watch: {
    data(new_data, old_data) {
    },
  },
  methods: {
    toggleModal() {
      this.handleCloseModal()
    },
    async buyNFT() {
      const amount = parseFloat(this.data[0].listing_price).toFixed(this.data[0].price.token_precision)
      const total = parseFloat(this.data[0].price.amount).toFixed(this.data[0].price.token_precision)
      // return
      const actions = [
        {
          account: 'atomicassets',
          name: 'transfer',
          authorization: [
            {
              actor: this.data[0].assets[0].owner,
              permission: 'active',
            },
          ],
          data: {
            from: this.data[0].sale_id,
            asset_ids_to_assert: this.data[0].assets[0].asset_id,
            listing_price_to_assert: `${amount} ${this.data[0].price.token_symbol}`,
            settlement_symbol_to_assert: `${this.data[0].price.token_precision} ${this.data[0].price.token_symbol}`
          },
        },
      ]
      // return
      try {
        await this.$store.dispatch('chain/sendTransaction', actions)
        this.$notify({
          title: 'Asset Transfer',
          message: 'Asset Transferred!',
          type: 'success',
        })
      } catch (e) {
        this.$notify({
          title: 'Asset Transfer',
          message: e,
          type: 'error',
        })
      } finally {
      }
    },
    makeOffer() {
      this.$router.push(`/nft-market/make_buy_offer/${this.assetId}`)
    }
  },
}
</script>

<style lang="scss">
.nft-modal-container {
  position: fixed;
  z-index: 999;
  width: 100vw;
  top: 0;
  left: 0;
  .el-dialog {
    border-radius: 8px;
    background-color: #212121;
    width: 605px;
    min-height: 440px !important;
    height: auto !important;
    .el-dialog__header {
      display: none;
    }
    .el-dialog__body {
      padding-top: 0;
    }
  }
  .el-icon-close {
    position: absolute;
    top: 20px;
    right: 15px;
    cursor: pointer;
  }
  .main-img {
    height: 100%;
    widows: 200px;
  }
  .modal-header {
    border-color: #3c3c43;
  }
  .normal-card header {
    padding: 5px 0;
  }
  .nft-info {
    margin-top: 20px;
    h5 {
      font-size: 14px;
    }
    input {
      color: #9f979a;
      width: 100%;
      padding: 2px 8px;
      background-color: #161617;
      margin: 12px 0;
      border: none;
      border-radius: 2px;
    }
    p {
      color: #ff4949;
      font-size: 12px;
    }
  }
  .buy-nft-btn {
    cursor: pointer;
    padding: 13px;
    width: 100%;
    border-radius: 8px;
    background-color: #444;
  }
  .tradeoffercard {
    background-color: #161617;
    border-radius: 8px;
  }
  .modal-header {
    font-size: 14px;
    font-weight: 500;
    display: block !important;
    margin-bottom: 27.5px;
    img {
      margin-right: 5px;
    }
  }
  div.modal-header > .main-img {
    width: 235px;
    height: 235px;
  }
  .make-offer:hover {
    cursor: pointer;
    color:#67c23a;
  }
}
</style>
