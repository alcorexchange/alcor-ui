<template lang="pug">
.wallet-position-row
  .operation
    .type(:class="item.type === 'buy' ? 'green' : 'red'") {{ $t(item.type.toUpperCase()) }}
    .market {{ item.ask.symbol.symbol }} / {{ item.bid.symbol.symbol }}
    .time.cancel {{ item.timestamp | moment('DD-MM HH:mm') }}
  .order
    .row
      .key.cancel {{ $t('Price') }}
      .value {{ item.unit_price | humanPrice }}
    .row
      .key.cancel {{ $t('Bid') }}
      .value {{ item.bid.quantity | commaFloat }}
    .row
      .key.cancel {{ $t('Ask') }}
      .value {{ item.ask.quantity | commaFloat }}

  .action
    el-button(type="text" @click="cancelOrder(item)").red.hover-opacity {{ $t('Cancel') }}
</template>

<script>
import TokenImage from '@/components/elements/TokenImage'

export default {
  components: { TokenImage },
  props: ['item'],
  methods: {
    async cancelOrder(order) {
      try {
        await this.$store.dispatch('chain/cancelorder', {
          account: this.user.name,
          market_id: order.market_id,
          type: order.type == 'buy' ? 'bid' : 'ask',
          order_id: order.id
        })
      } catch (e) {
        this.$notify({ title: 'Order cancel error', message: e.message, type: 'warning' })
      }

      this.$notify({ title: 'Success', message: `Order canceled ${order.id}`, type: 'success' })
    }
  }
}

</script>

<style lang="scss" scoped>
.wallet-position-row {
  display: flex;
  align-items: center;
  padding: 10px 20px;
  border-bottom: 1px solid var(--background-color-base);

  @media only screen and (max-width: 1176px) {
    padding: 10px;
  }

  .operation {
    width: 33%;

    .market {
      font-size: 12px;
    }

    .time {
      font-size: 12px;
    }

    .type {
      &.green {
        color: var(--main-green);
      }

      &.red {
        color: var(--main-red);
      }
    }
  }

  .order,
  .action {
    width: 33%;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
  }

  .order {
    .row {
      display: flex;
      flex-wrap: wrap;
      text-align: right;
      justify-content: right;
      align-items: center;
      row-gap: 0px;
      column-gap: 5px;
      font-size: 14px;

      @media only screen and (max-width: 1176px) {
        column-gap: 3px;
        font-size: 11px;
      }

    }
  }

  .action {

    .el-button {
      &.red {
        color: var(--main-red) !important;
      }

      &.green {
        color: var(--main-green) !important;
      }
    }
  }
}
</style>
