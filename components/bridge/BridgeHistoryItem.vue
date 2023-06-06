<template lang="pug">
.bridge-history-item
  .main.fs-14
    .date.fs-12.mb-2 13:48 Jul 19, 2023
    .sides
      BridgeHistoryItemSide(
        :chain="item.source", :quantity="item.quantity", :account="item.sender", :trxId="item.sourceTrx")
      .arrow
        i.el-icon-right
      BridgeHistoryItemSide(:chain="item.destination", :quantity="item.quantity", :account="item.recipient", :trxId="item.destinationTrx")
  .status-container
      .status(v-if="item.completed" :style="{color: statusColor}")
        i(:class="statusIcon")
        span.status-text.fs-14 Completed
      .request(v-else)
        AlcorButton(@click="submitRequest") Submit Request
</template>

<script>
import AlcorButton from '@/components/AlcorButton'
import BridgeHistoryItemSide from './BridgeHistoryItemSide.vue'
export default {
  props: ['item'],
  components: {
    BridgeHistoryItemSide,
    AlcorButton
  },
  computed: {
    statusColor() {
      return 'var(--main-green)'
    },
    statusIcon() {
      return 'el-icon-check'
    },
  },
  methods: {
    async submitRequest() {
      console.log('not implemented');
    /*
      const account = await this.$store.dispatch('chain/asyncLogin', {
        chain: 'wax',
        message: 'connect'
      });
      const destinationWallet = {
        wallet: account.wallet,
        name: account.name,
        authorization: account.authorization,
      };
      const ibcTransfer = new IBCTransfer(
        'eos',
        'wax',
        null,
        this.destinationWallet,
        (...args) => { console.log(args); }
      );
      const { scheduledProofs, restActions } = await fetchActionsToSign();
      if (scheduledProofs) {
        destinationWallet.wallet.transact({
          actions: [...scheduledProofs],
        }, settings);
      }
      destinationWallet.wallet.transact({
        actions: [...restActions],
      }, settings);
    */
    }
  }
}
</script>

<style scoped lang="scss">
.bridge-history-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  background: var(--background-color-base);
  border-radius: 6px;
  padding: 12px;
}

.main {
  display: flex;
  flex-direction: column;
}

.date {
  color: var(--text-grey-thirdly);
}

.sides {
  display: flex;
  align-items: center;
  gap: 14px;
}

.status-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.status {
  display: flex;
  align-items: center;
  gap: 4px;
}

.request {
  .alcor-button {
    color: var(--main-green);
  }
}

</style>
