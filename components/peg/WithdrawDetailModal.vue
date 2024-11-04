<template lang="pug">
  ElDialog(
    :visible="active"
    @update:visible="$emit('update:active', $event)"
    custom-class="withdraw-detail-modal"
    title="Withdrawal Details"
  )
    template(v-if="context")
      .info-items
        .info-item
          .info-item-label Status
          .info-item-value {{ statuses[context.state]?.label || '--' }}
        .info-item
          .info-item-label Crypto
          .info-item-value {{ context.currency.symbol }}
        .info-item
          .info-item-label Network
          .info-item-value {{ context.currency.chain.name }}
        .info-item
          .info-item-label Amount
          .info-item-value {{ context.amount }}
        .info-item
          .info-item-label Fee
          .info-item-value {{ context.our_fee_amount }}
        .info-item
          .info-item-label Withdrawal Address
          .info-item-value
            span {{ context.address }}
            span
              span.hover-opacity.pointer(@click="copyTx(context.address)")
                i.el-icon-copy-document
        .info-item
          .info-item-label TX
          .info-item-value(v-if="context.tx_hash")
            span {{ context.tx_hash }}
            div.actions
              a.hover-opacity.pointer(:href="$monitorBlockchainTx(context.tx_hash, context.currency.chain.code)" target="_blank")
                i.el-icon-link
              span.hover-opacity.pointer(@click="copyTx(context.address)")
                i.el-icon-copy-document
          .info-item-value(v-else) --
</template>

<script>
export default {
  name: 'WithdrawDetailModal',
  props: ['active', 'context', 'statuses'],
  methods: {
    copyTx(tx) {
      try {
        navigator.clipboard.writeText(tx)
        this.$notify({
          title: 'Clipboard',
          message: 'Address copied.',
          type: 'info',
        })
      } catch (error) {}
    },
  },
}
</script>

<style lang="scss">
.withdraw-detail-modal {
  width: 90% !important;
  max-width: 480px;

  .info-items {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .info-item {
    display: flex;
    justify-content: space-between;
    gap: 8px;
  }
  .info-item-label {
    color: var(--text-disable);
    white-space: nowrap;
  }
  .info-item-value {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    text-align: end;
  }
  .actions {
    display: flex;
    gap: 4px;
  }
}
</style>
