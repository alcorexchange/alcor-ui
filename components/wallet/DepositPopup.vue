<template lang="pug">
  el-dialog(:visible.sync="visible"  width="400px")
    template(#title)
        .title-container
            i.el-icon-wallet
            .text Deposit Token
    .main
        //- .qr-code
        //-     img(src="https://chart.googleapis.com/chart?chs=250x250&cht=qr&chl=22trc.wam&choe=UTF-8")
        .account-name(@click="copyName")
            div WAX Account Name:
            div.copy-container
                span.name {{this.$store.state.user && this.$store.state.user.name}}
                i.el-icon-copy-document
        AlcorButton.done(@click="closePopup") Done
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
  methods: {
    copyName() {
      navigator.clipboard.writeText(this.$store.state.user.name)
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
