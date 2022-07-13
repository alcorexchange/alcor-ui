<template lang="pug">
.icon-btn
  i.el-icon-setting(@click='visible = true')

  el-dialog(
    title='Times and sales settings'
    :visible.sync='visible'
    append-to-body width="350px"
    custom-class="trading-page-dialog"

    :before-close="beforeDialogClose"
    @mousedown.native="dialogMousedown"
    @mouseup.native="dialogMouseup"
  )
    .d-flex.align-items-center
      span Amount in:

      el-radio-group.alcor-radio(v-model="showQuote" size="mini").ml-auto
        el-radio-button(:label='$t("Token")')
        el-radio-button(:label='$t("Quote")')

    .d-flex.align-items-center.mt-2
      span Time format:

      el-select.time-format-selection(v-model='timeformat', placeholder='choose time format' size="mini").ml-auto
        el-option(v-for='item in options', :key='item.value', :label='item.label', :value='item.timeformat')

    .d-flex.align-items-center.mt-2
      span Large trade threshold:

      el-input.threshold-input(v-model='largeThreshold' size="mini").w-25.ml-auto

      el-select.trade-type-selection(v-model='thresholdCurrency' placeholder='Currency' size="mini").w-25.ml-2
        el-option(:value="base_token.symbol.name") {{ base_token.symbol.name }}
        el-option(:value="quote_token.symbol.name") {{ quote_token.symbol.name }}

    .d-flex.align-items-center.mt-2
      span Preview:

    .d-flex.align-items-center.mt-2
      .orders-list.blist.px-0
        a
          .ltd.d-flex.justify-content-around.sell.max-sellmatch
            span.red 0.00035001
            span 12,771,693.4181
            span 04-02 14:14:12

        a
          .ltd.d-flex.justify-content-around.buy.max-buymatch
            span.green 0.00029645
            span 33,344,876
            span 04-02 13:55:52
</template>

<script>
import { mapState } from 'vuex'

export default {
  props: ['outoftimesalemodalClick', 'closemodal'],
  scrollToTop: false,

  data() {
    return {
      visible: false,

      deals: [],
      options: [
        {
          timeformat: 'DD/MM hh:mm:ss',
          label: 'dd/MM hh:mm:ss'
        },
        {
          timeformat: 'MM/DD hh:mm:ss',
          label: 'MM/dd hh:mm:ss'
        },
        {
          timeformat: 'DD hh:mm:ss',
          label: 'dd hh:mm:ss'
        },
        {
          timeformat: 'DD hh:mm',
          label: 'dd hh:mm'
        },
        {
          timeformat: 'hh:mm:ss',
          label: 'hh:mm:ss'
        }
      ],
      thresholds_options: [
        {
          threshold: 'WAX',
          label: 'wax'
        },
        {
          threshold: 'VOID',
          label: 'void'
        }
      ],
      threshold: 'Currency'
    }
  },
  computed: {
    ...mapState('market', ['quote_token', 'base_token', 'id']),
    ...mapState('settings', ['timesAndSales']),
    ...mapState(['network']),

    showQuote: {
      get() {
        return (this.timesAndSales[this.id] || {}).showQuote || 'Quote'
      },

      set(showQuote) {
        this.$store.dispatch('settings/updateTimeAndSales', { market: this.id, key: 'showQuote', value: showQuote })
      }
    },

    timeformat: {
      get() {
        return (this.timesAndSales[this.id] || {}).timeformat || 'MM/DD hh:mm:ss'
      },

      set(timeformat) {
        this.$store.dispatch('settings/updateTimeAndSales', { market: this.id, key: 'timeformat', value: timeformat })
      }
    },

    largeThreshold: {
      get() {
        const settings = this.timesAndSales[this.id] || {}
        return settings[this.thresholdCurrency]
      },

      set(largeThreshold) {
        this.$store.dispatch('settings/updateTimeAndSales', { market: this.id, key: this.thresholdCurrency, value: largeThreshold })
      }
    },

    thresholdCurrency: {
      get() {
        return (this.timesAndSales[this.id] || {}).thresholdCurrency || this.base_token.symbol.name
      },

      set(thresholdCurrency) {
        this.$store.dispatch('settings/updateTimeAndSales', { market: this.id, key: 'thresholdCurrency', value: thresholdCurrency })
      }
    },

    coloredDeals() {
      let maxBuy = 0
      let maxSell = 0
      const maxarry = []
      Array.from(this.$store.state.market.deals)
        .sort((a, b) => b.time - a.time)
        .map((h) => {
          if (h.type == 'buymatch') {
            if (h.amount >= maxBuy) {
              maxBuy = h.amount
            }
          }
          if (h.type == 'sellmatch') {
            if (h.amount >= maxSell) {
              maxSell = h.amount
            }
          }
        })
      Array.from(this.$store.state.market.deals)
        .sort((a, b) => b.time - a.time)
        .map((h) => {
          if (h.type == 'buymatch') {
            if (h.amount == maxBuy) {
              h.cls = 'max-buymatch'
              maxarry.push(h)
            } else {
              h.cls = 'text-success'
            }
            h.amount = h.bid
          } else {
            if (h.amount == maxSell) {
              h.cls = 'max-sellmatch'
              maxarry.push(h)
            } else {
              h.cls = 'text-danger'
            }
            h.amount = h.ask
          }
        })
      return maxarry
    }
  },
  methods: {
    handleCommand(command) {
      this.$message('click on item ' + command)
    }
  }
}
</script>

<style>
.el-scrollbar__wrap {
  margin-bottom: -15px !important;
}
</style>
