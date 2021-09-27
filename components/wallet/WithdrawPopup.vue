<template lang="pug">
  el-dialog(:visible.sync="visible"  width="400px")
    template(#title)
        .title-container
            i.el-icon-wallet
            .text Withdraw Token
    .main
      .label Transfer to
      el-input(placeholder="Address")
      .label Amount
      .balance Balance: 270.588 WAX
      el-input(placeholder="0")
      .label Memo
      el-input(placeholder="Message" )
      AlcorButton.done() Transfer
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
  align-items: flex-start;
}
.done {
  width: 100%;
  color: var(--main-green);
  padding: 10px;
  border-radius: 10px;
}
.label {
  font-size: 1rem;
  color: var(--text-default);
  padding-bottom: 20px;
}
.balance {
  color: var(--text-default);
}
.el-input::v-deep {
  margin-bottom: 26px;
  input {
    background: var(--btn-active);
  }
}
</style>
