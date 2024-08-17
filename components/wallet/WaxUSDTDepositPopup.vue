<template lang="pug">
  el-dialog(:visible.sync="visible" width="500px")
    template(#title)
      .title-container
        i.el-icon-wallet
        .text Deposit USDT to WAX from CEX
    .main(v-if="this.$store.state.user && this.$store.state.user.name")
      blockquote.blockquote.text-left
        p.text-wrap.mb-0
          | Alcor use the EOS network as a USDT provider. When withdrawing, you must select the EOS network.
        footer.blockquote-footer.mt-1
          | Carefully read the instructions before making a deposit.
        footer.blockquote-footer.mt-1
          | We support USDT deposits with Binance/KuCoin/Other CEX's.

      img(width="100%" src="~/assets/images/binance-usdt-deposit.jpg")

      .d-flex.mt-2.mb-2
        .account-name
          .lead Address:
          div.copy-container.pointer(@click="copyAddress").hover-opacity
            span.name w.ibc.alcor
            i.el-icon-copy-document

        .account-name.ml-3
          .lead MEMO:
          div.copy-container.pointer(@click="copyMemo").hover-opacity
            span.name {{ memo }}
            i.el-icon-copy-document

      h6.mb-3.red
        | Fill in the fields on the exchange exactly as above
        br
        | An incorrectly filled MEMO can lead to loss of funds

      AlcorButton.done(@click="closePopup") {{$t('Done')}}
    .main(v-else)
      you need log in
</template>

<script>
import AlcorButton from '@/components/AlcorButton.vue'
export default {
  name: 'DepositPopup',
  components: {
    AlcorButton
  },
  data: () => ({
    visible: false
  }),
  computed: {
    memo() {
      return this.$store.state.user.name.replaceAll('.', '0')
    }
  },

  methods: {
    copyAddress() {
      navigator.clipboard.writeText('w.ibc.alcor')
      this.$notify({
        title: 'Clipboard',
        message: 'Address name copyed to Clipboard',
        type: 'info'
      })
    },

    copyMemo() {
      navigator.clipboard.writeText(this.memo)
      this.$notify({
        title: 'Clipboard',
        message: 'Account name copyed to Clipboard',
        type: 'info'
      })
    },
    openPopup() {
      this.visible = true
    },
    closePopup() {
      this.visible = false
    }
  }
}
</script>

<style scoped lang="scss">
.title-container {
  display: flex;
  align-items: center;

  .text {
    font-weight: 500;
    padding-left: 8px;
  }
}

.main {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.qr-code {
  border-radius: 14px;
  padding: 24px;
  border-radius: 12px;
  width: 100%;
  max-width: 200px;
  background: var(--btn-active);

  img {
    object-fit: contain;
    width: 100%;
  }
}

.account-name {
  display: flex;
  align-items: center;
  color: var(--text-default);
  margin: 14px 0;
  cursor: pointer;

  .copy-container {
    margin-left: 6px;
    display: flex;
    align-items: center;
    background: var(--btn-active);
    padding: 4px 10px;
    border-radius: 4px;

    .name {
      padding-right: 6px;
      font-size: 0.86rem;
    }
  }
}

.done {
  width: 100%;
  color: var(--main-green);
  padding: 10px;
  border-radius: 10px;
}
</style>
