<template lang="pug">
.icon-btn
  i.el-icon-setting(@click='visible = true')

  el-dialog(title='Orderbook settings' :visible.sync='visible' append-to-body width="400px" custom-class="trading-page-dialog")
    .text-muted {{ $t('Orderbook Preview') }}

    .order-book.orderbook-preview
      .orders-list
        .ltd.orderbook-progress
          .progress-container
            .order-row
              .red.text-left 0.00036
              .text-right 953,803.2766
              .text-right 343.36917957
            .progress-bar.sell(:style="'transform: translateX(-' + (sum == 'Total Sum' ? '70' : '25') + '%);'")

        .ltd.orderbook-progress
          .progress-container
            .order-row
              .red.text-left 0.000358
              .text-right 4,279,378.8064
              .text-right 1,532.01761269
            .progress-bar.sell(:style="'transform: translateX(-' + (sum == 'Total Sum' ? '60' : '70') + '%);'")

        .ltd.orderbook-progress
          .progress-container
            .order-row
              .red.text-left 0.00035797
              .text-right 42,346.077
              .text-right 15.15862518
            .progress-bar.sell(:style="'transform: translateX(-' + (sum == 'Total Sum' ? '20' : '5') + '%);'")

      .latest-price
        .left.d-flex.align-items-center.green
          .arrow.green.mr-2
            i.el-icon-caret-bottom

          div
            .price.green
              span 0.00035001 &nbsp;
              .text-muted (0.000124$)

        .right
          el-tooltip.item(effect='dark', content='Spread', placement='top-end')
            .spread
              .text-end 4.36%
              .text-muted 0.0008611

      .orderbook-preview.orders-list
        .ltd.orderbook-progress
          .progress-container
            .order-row
              .green.text-left 0.00035001
              .text-right 258,165.00
              .text-right 23.28944077
            .progress-bar.buy(:style="'transform: translateX(-' + (sum == 'Total Sum' ? '10' : '20') + '%);'")

        .ltd.orderbook-progress
          .progress-container
            .order-row
              .green.text-left 0.00035
              .text-right 32,201.11
              .text-right 10.00
            .progress-bar.buy(:style="'transform: translateX(-' + (sum == 'Total Sum' ? '20' : '10') + '%);'")

        .ltd.orderbook-progress
          .progress-container
            .order-row
              .green.text-left 0.00034427
              .text-right 911,341.6727
              .text-right 313.74759766
            .progress-bar.buy(:style="'transform: translateX(-' + (sum == 'Total Sum' ? '50' : '70') + '%);'")

    .text-muted.mt-2  {{ $t('Orderbook Settings') }}

    .d-flex.mt-1.align-items-end
      span {{ $t('Orderbook Visualization') }}

      el-radio-group.alcor-radio(v-model="sum" size="mini").ml-auto
        el-radio-button(:label="'% ' + $t('Total')")
        el-radio-button(:label='$t("Total Sum")')

</template>

<script>
export default {
  data() {
    return {
      visible: false
    }
  },

  computed: {
    sum: {
      get() {
        return this.$store.state.market.orderbook_settings.totalSum
      },

      set(value) {
        this.$store.commit('market/setOrderbookSettings', {
          ...this.$store.state.market.orderbook_settings,
          totalSum: value
        })
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.red {
  color: var(--color-secondary);
}

.green {
  color: var(--color-primary);
}

.orderbook-preview.order-book {
  padding: 10px 20px;
}

.orderbook-preview {
  .order-row {
    height: 20px !important;
  }

  .sell-row {
    span:first-child {
      color: var(--main-red);
    }
  }
}
</style>
