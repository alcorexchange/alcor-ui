<template lang="pug">
.bridge-history.mt-4
  .toggle.d-flex.justify-content-center
    AlcorButton(@click="active = !active")
      span {{active ? 'Minimize' : 'Show'}} History
      i(:class="`el-icon-arrow-${active ? 'up' : 'down'}`")

  el-table(
    :data="[{}, {}]"
  )
    el-table-column(label="Time")
      template(slot-scope='{row}')
        .time
          .hour 13:48
          .date Jul 9, 2023
    el-table-column(label="Transfer")
      template(slot-scope='{row}')
        .main-content
          .left
            .network
              img(:src="require(`~/assets/icons/${'wax'}.png`)").network-img
              span EOS
            .token-container
              img.token-img(:src="require(`~/assets/icons/${'matic'}.png`)")
              .amount 10.00
              .symbol TLM
            .tx
              img(:src="require(`~/assets/icons/${'eos'}.png`)").tx-img
              span.tx-Link TX link
          .arrow
            i.el-icon-right
          .right
            .network
              img(:src="require(`~/assets/icons/${'matic'}.png`)").network-img
              span EOS
            .token-container
              img.token-img(:src="require(`~/assets/icons/${'matic'}.png`)")
              .amount 10.00
              .symbol TLM
            .tx
              img(:src="require(`~/assets/icons/${'eos'}.png`)").tx-img
              span.tx-Link TX link
    el-table-column(label="Txs" width="100")
    el-table-column(label="Status")
      template(slot-scope='{row}')
        .status.red
          i.el-icon-error
          span incomplete
</template>

<script>
import AlcorButton from '~/components/AlcorButton.vue'

export default {
  name: 'BridgeHistory',
  components: {
    AlcorButton,
  },
  data: () => ({
    active: false
  })
}
</script>

<style scoped lang="scss">
.main-content {
  display: flex;
  align-items: flex-start;
  align-self: center;
  gap: 8px;
  .left, .right {
    display: flex;
    gap: 4px;
    flex-direction: column;
  }
  .arrow i {
    font-size: 1.6rem;
  }
  .left {
    align-items: flex-end;
  }
  .right {
    align-items: flex-start;
  }
  .network {
    background: var(--btn-active);
    padding: 2px 4px;
    border-radius: 20px;
    display: flex;
    font-size: 0.86rem;
    align-items: center;
    gap: 4px;
    &-img {
      height: 18px;
    }
  }
  .token-container {
    display: flex;
    gap: 4px;
    align-items: center;
  }
  .token-img {
    height: 18px;
  }
  .tx {
    display: flex;
    align-items: center;
    font-size: 0.86rem;
    .tx-img {
      height: 18px;
    }
  }
}
.status {
  box-shadow: 0 0 0 1px var(--main-red);
  padding: 2px 4px;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.86rem;
  border-radius: 4px;
}
.time {
  display: flex;
  flex-direction: column;
  gap: 6px;
  .hour {
    font-size: 0.86rem;
  }
}
</style>
