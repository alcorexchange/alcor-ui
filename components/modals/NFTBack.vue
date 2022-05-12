<template lang="pug">
el-dialog.nft-modal-container(:visible='is_modal')
  .nft-modal
    i.el-icon-close(@click='this.toggleModal')
    p.modal-header
      img(src='~/assets/images/poker_chip.svg')
      | Back NFT
    .row
      .d-flex.justify-content-between
        .col-5
          TradeOfferCard(
            :data='{ maker: "gchad.wam", id: "50", nobtngroup: true }',
            price=0
          )
        .col-7
          .nft-info
            h5 Back NFT with tokens
            input(placeholder='Amount of WAX')
            p Once you back an NFT with tokens you can only free the tokens by burning the NFT!
              img.pl-1(src='~/assets/images/fire.svg', alt='')
            .back-nft-btn.text-center Back NFT
</template>

<script>
import TradeOfferCard from '~/components/nft_markets/TradeOfferCard'
export default {
  components: { TradeOfferCard },
  props: ['show_modal', 'handleCloseModal'],
  computed: {
    is_modal() {
      if (this.show_modal) {
        return true
      } else return false
    },
  },
  methods: {
    toggleModal() {
      console.log('toggle')
      this.handleCloseModal()
    },
  },
}
</script>

<style lang="scss">
.nft-modal-container {
  position: fixed;
  z-index: 999;
  width: 100vw;
  height: 100vh;
  top: 0;
  left: 0;
  .el-dialog {
    border-radius: 8px;
    background-color: #212121;
    width: 605px;
    height: 440px;
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
  .modal-header {
    border-color: #3c3c43;
  }
  .normal-card header {
    padding: 5px 0;
  }
  .nft-info {
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
  .back-nft-btn {
    cursor: pointer;
    margin-top: 157px;
    padding: 13px;
    width: 100%;
    border-radius: 8px;
    background-color: #333;
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
}
</style>
