<template lang="pug">
.body-timesale-container(@click='outoftimesalemodalClick', v-loading='loading')
  .timesale-settings.d-flex.flex-column.px-2.py-3.justify-content-around
    .close-timesale
      button.close(type='button', @click='closemodal', data-dismiss='modal') &times;
    .time-sale-list.amount-in.d-flex.flex-row.justify-content-between
      .amount-title.mt-auto.mb-auto
        label.amount-label Amount in:
      .token-quote.d-flex.flex-row.justify-content-center
        //- el-button.token-btn.text-center(type='info') Token
        //- span /
        //- el-button.quote-btn(type='info') Quote
        label.toggle-format
          input(type='checkbox')
          .slider
          .option.token-option
            span Token
          span.slash /
          .option.quote-option
            span Quote
    .time-sale-list.time-format.d-flex.flex-row.justify-content-between
      .time-format-title.mt-auto.mb-auto
        label.time-format-label Time format:
      .time-format-menu.d-flex.flex-row
        el-select.time-format-selection(
          v-model='timeformat',
          @change='changeTimeFormat(timeformat)',
          placeholder='choose time format'
        )
          el-option(
            v-for='item in options',
            :key='item.value',
            :label='item.label',
            :value='item.timeformat'
          )
    .time-sale-list.large-trade-threshold.d-flex.flex-row.justify-content-between
      .threshold-title.mt-auto.mb-auto
        label.threshold-label Larage trade threshold:
      .trade-threshold-value
        span 100 WAX
    .time-sale-list.timesale-preview.d-flex.flex-column.justify-content-between(
      v-if='coloredDeals'
    )
      .preview-deal-title
        span Preview:
      .display-preview-element
        .deals-preview(v-loading='loading')
          .max-orders-list.blist
            a(
              v-for='deal in coloredDeals',
              :href='monitorTx(deal.trx_id)',
              target='_blank'
            )
              .ltd.d-flex.justify-content-around(:class='deal.cls + "-deal"')
                .col-md-3.span.max-buymatch-first.text-left(
                  :class='deal.cls + "-preview"'
                ) {{ deal.unit_price }}
                .col-md-3.span.text-white.text-left {{ deal.amount | commaFloat(3) }}
                .col-md-6.span.text-white.text-left {{ deal.time | moment(timeformat) }}
</template>

<script>
import { mapState } from 'vuex'

export default {
  props: ['outoftimesalemodalClick', 'closemodal'],
  scrollToTop: false,
  data() {
    return {
      loading: false,
      deals: [],
      options: [
        {
          timeformat: 'dd/MM hh/mm/ss',
          label: 'dd/MM hh/mm/ss',
        },
        {
          timeformat: 'MM/dd hh/mm/ss',
          label: 'MM/dd hh/mm/ss',
        },
        {
          timeformat: 'dd hh/mm/ss',
          label: 'dd hh/mm/ss',
        },
        {
          timeformat: 'dd hh/mm',
          label: 'dd hh/mm',
        },
        {
          timeformat: 'hh/mm/ss',
          label: 'hh/mm/ss',
        },
        {
          timeformat: 'DD-MM HH:mm',
          label: 'DD-MM HH:mm',
        },
      ],
      timeformat: 'DD-MM HH:mm',
    }
  },
  computed: {
    ...mapState('market', ['quote_token', 'base_token', 'id']),
    ...mapState(['network']),
    coloredDeals() {
      // let amArry = this.$store.state.market.deals
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
    },
  },
  methods: {
    handleCommand(command) {
      this.$message('click on item ' + command)
    },
    changeTimeFormat(timeformat) {
      //emit data from child compoent to parent compoent
      this.$emit('changedtimeformat', timeformat)
    },
  },
}
</script>

<style lang="scss">
.body-timesale-container {
  position: fixed !important;
  left: 0 !important;
  top: 0 !important;
  width: 100vw !important;
  height: 100vh !important;
  background-color: rgba(22, 22, 23, 0.8) !important;
}

.timesale-settings {
  width: 387px;
  height: auto;
  position: absolute;
  padding: 0 0 0 18px;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: #e5e5e5;
  /* bg-dark-card */

  background: #212121;
  border: 2px solid #3f3f3f;
  box-sizing: border-box;
  box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.25);
  border-radius: 2px;
}

.close-timesale {
  position: fixed;
  right: 0px;
  top: 0px;
  width: 20px;
  height: 20px;
  background-color: #3f3f3f;
  color: white;
  .close {
    position: absolute;
    right: 1px;
    top: -6px;
    color: #ffffff;
    font-weight: 100;
  }
}

.time-sale-list {
  margin: 4px;
  font-style: normal;
  font-weight: 400;
  font-size: 12px;
  line-height: 14px;
  z-index: -1;
  /* text-dark-default */

  color: #f2f2f2;
  &.amount-in {
    padding-right: 55px;
  }
  &.large-trade-threshold {
    padding-right: 55px;
  }
}

.token-quote {
  width: 128px;
  height: 24px;
  z-index: -1;
  /* black-primary */

  background: #161617;
  border-radius: 4px;
  .token-btn,
  .quote-btn {
    width: 48px;
    height: 20px;
    background: #161617;
    font-size: 14px;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 2px 5px;
    align-items: center;
    color: #f2f2f2;
    border: 1px solid #161617;
  }
}

.time-format-menu {
  width: 182px;
  height: 24px;
  background: #333333;
  border-radius: 2px;
  .time-format-selection {
    font-style: normal;
    font-weight: 400;
    font-size: 12px;
    line-height: 14px;
  }
  .el-input {
    width: 182px;
    height: 24px;
    background: #333333;
    border-radius: 2px;
  }
  .el-input__inner {
    -webkit-appearance: none;
    background-color: #282828;
    background-image: none;
    border-radius: 4px;
    border: 1px solid transparent;
    box-sizing: border-box;
    color: #fff;
    display: inline-block;
    font-size: inherit;
    height: 24px;
    // line-height: 40px;
    outline: 0;
    padding: 0 15px;
    transition: border-color 0.2s cubic-bezier(0.645, 0.045, 0.355, 1);
    width: 100%;
  }
  .el-select__caret.el-input__icon.el-icon-arrow-up {
    align-items: center;
    text-align: center;
    justify-content: center;
    display: flex;
  }
}

.trade-threshold-value {
  width: 128px;
  height: 24px;
  background-color: #161617;
  border-radius: 2px;
  font-family: 'Roboto';
  font-style: normal;
  font-weight: 400;
  font-size: 12px;
  line-height: 14px;
  align-items: center;
  display: flex;
  justify-content: flex-start;
  padding-left: 5px;
}

.blist a {
  all: unset;
}
.max-buymatch-preview {
  color: #66c167;
}
.max-sellmatch-preview {
  color: #f96c6c;
}

.preview-deal-title {
  padding: 3px 0px;
}
.deals-history {
  .max-orders-list {
    height: 350px;
  }
}

.toggle-format {
  color: white;
  position: relative;
  font-family: 'Raleway', sans-serif;
  display: flex;
  align-items: center;
  .slash {
    font-size: 1.2em;
    font-weight: bold;
    display: inline-block;
    text-align: start;
    padding: 2px;
  }
  @keyframes switch-right {
    0% {
      max-width: 6.1em;
    }
    33% {
      max-width: 14.4em;
    }
    66% {
      max-width: 14.4em;
      transform: translateX(0em);
    }
    100% {
      max-width: 7.9em;
      transform: translateX(5.8em);
    }
  }
  @keyframes switch-left {
    0% {
      max-width: 7.9em;
      transform: translateX(6.4em);
    }
    33% {
      max-width: 14.4em;
      transform: translateX(0em);
    }
    66% {
      max-width: 14.4em;
    }
    100% {
      max-width: 6.1em;
    }
  }

  input {
    display: none;
    z-index: 2;
  }

  input + .slider {
    animation: switch-left 0.5s ease forwards;
  }

  input:checked + .slider {
    animation: switch-right 0.5s ease forwards;
  }

  .slider {
    position: absolute;
    display: block;
    border-radius: 2px;
    background-color: #333333;
    width: 48px;
    max-width: 50px;
    height: 20px;
    z-index: -1;
  }

  .option {
    padding: 2px;
    margin: 0px 5px;
    font-size: 1.2em;
    display: inline-block;
    cursor: pointer;
  }

  .token-option {
    position: relative;
    left: -2px;
  }

  .quote-option {
    position: relative;
    left: 3px;
  }
}
</style>
