<template lang="pug">
.bridge-history.mt-4
  .toggle.d-flex.justify-content-center
    AlcorButton(@click="active = !active")
      span {{active ? 'Minimize' : 'Show'}} History
      i(:class="`el-icon-arrow-${active ? 'up' : 'down'}`")

  el-table(
    :data="[{}, {}]"
    class="bridge-history-table"
  )
    el-table-column(label="Time" width="100")
      template(slot-scope='{row}')
        .time
          .hour 13:48
          .date Jul 9, 2023
    el-table-column(label="Transfer")
      template(slot-scope='{row}')
        .main-content
          .left
            .network
              span.text Network
              .network-content
                img(:src="require(`~/assets/icons/${'wax'}.png`)").network-img
                span EOS
            .token-container
              img.token-img(:src="require(`~/assets/icons/${'matic'}.png`)")
              .amount 10.00
              .symbol TLM
          .arrow
            i.el-icon-right
          .right
            .network
              span.text Network
              .network-content
                img(:src="require(`~/assets/icons/${'wax'}.png`)").network-img
                span EOS
            .token-container
              img.token-img(:src="require(`~/assets/icons/${'matic'}.png`)")
              .amount 10.00
              .symbol TLM

    el-table-column(label="Txs" width="100")
      template(#default="{row}")
       .tx
          img(:src="require(`~/assets/icons/${'eos'}.png`)").tx-img
          span.tx-Link TX link

    el-table-column(label="Status" width="140" className="status-col" align="right")
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
    font-size: 1.4rem;
  }
  .left {
    align-items: flex-end;
  }
  .right {
    align-items: flex-start;
  }
  .network {
    display: flex;
    gap: 4px;
    align-items: center;
    &-content {
      font-size: 0.86rem;
      background: var(--btn-active);
      padding: 2px 6px;
      border-radius: 20px;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .text {
      font-size: 0.86rem;
    }
    &-img {
      height: 18px;
    }
  }
  .token-container {
    display: flex;
    gap: 4px;
    align-items: center;
    font-size: 1rem;
  }
  .token-img {
    height: 18px;
  }
}
.tx {
  display: flex;
  align-items: center;
  font-size: 0.86rem;
  .tx-img {
    height: 18px;
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
  gap: 4px;
  .hour {
    font-size: 0.86rem;
  }
}
</style>

<style lang="scss">
.bridge-history-table {
  .status-col {
    .cell {
      padding: 2px 10px !important;
      display: flex;
    }
  }
}
</style>
