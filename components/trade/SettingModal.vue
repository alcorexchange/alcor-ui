<template lang="pug">
.body-container(@click='outofmodalClick')
  .table-setting-modal
    .el-container.setting-container.pt-2.d-flex.flex-column
      .el-container.setting-layout.d-flex.flex-row
        h4.preview-title Chart Preview
        //preview-chart
      .el-container.setting-layout.d-flex.flex-row
        .el-main.module-main-settings.main-settings-left
          .module-selection.d-flex.flex-column
            preview-chart
              #preview_chart_container

      .el-container.setting-layout.d-flex.flex-row.mt-20
        .el-main.module-main-settings.main-settings-left
          .module-selection.d-flex.flex-column
            .settings-title Header Settings
            .module-list.d-flex.flex-row.justify-content-between(
              v-for='settingBtn in header_settings_title'
            )
              .module-name {{ settingBtn.name }}
              .module-pickers.d-flex.flex-row
              el-switch(
                v-model='header_settings_change[settingBtn.key]',
                @change='headerUpdateState()',
                active-color='#13ce66',
                inactive-color='#161617'
              )
        .el-main.module-main-settings.main-settings-right
          .module-selection.d-flex.flex-column
            .settings-title Chart Orders
            .module-list.d-flex.flex-row.justify-content-between(
              v-for='settingBtn in chart_orders_title'
            )
              .module-name {{ settingBtn.name }}
                p.tooltip-desc(
                  v-if='settingBtn.key == "chart_order_interactivity"'
                ) Order Interactivity allows you to move or cancel orders directly from the chart,
                  | just drag the lavel to move the order or click the "X" button to cancel the orther
              .module-pickers.d-flex.flex-row
              el-switch(
                v-if='settingBtn.key != "chart_executions"',
                v-model='chart_orders_settings_change[settingBtn.key]',
                @change='chartOrdersUpdateState()',
                active-color='#13ce66',
                inactive-color='#161617'
              )

      .el-container.setting-layout.d-flex.flex-row
        .el-main.module-main-settings.main-settings-left
          .module-selection.d-flex
            .el-button(type="text" @click='initiateState()') Reset to Default
</template>

<script>
import { mapState } from 'vuex'
import TokenImage from '~/components/elements/TokenImage'
import ChangePercent from '~/components/trade/ChangePercent'
//import PreviewChart from '~/components/trade/PreviewChart'
import PreviewChart from '~/components/trade/Chart.vue'

export default {
  props: ['outofmodalClick'],
  scrollToTop: false,
  components: {
    TokenImage,
    ChangePercent,
    PreviewChart
  },

  data() {
    return {
      header_settings_title: [
        { key: 'change_24', name: 'Change 24H' },
        { key: 'volume_24', name: 'Volume 24H' },
        { key: 'high_24', name: '24H High' },
        { key: 'low_24', name: '24H Low' },
        { key: 'volume_24_usd', name: 'Volume 24H USD' },
        { key: 'weekly_volume', name: 'Weekly Volume (WAX, USD)' },
        //{ key: 'all_time', name: 'All Time High/Low' }, TODO
      ],
      chart_orders_title: [
        { key: 'show_open_orders', name: 'Show open orders' },
        { key: 'show_labels', name: 'Show labels' },
        { key: 'chart_order_interactivity', name: 'Chart order interactivity' },
        //{ key: 'chart_executions', name: 'Chart Executions' },
        //{ key: 'show_trade_executions', name: 'Show trade executions' },
        // TODO
        //{
        //  key: 'show_trade_executions_price',
        //  name: 'Show trade execution price',
        //},
        //{
        //  key: 'show_trade_execution_amount',
        //  name: 'Show_trade_execution_amount',
        //},
      ],
      settingBtnTitles: {
        chart: 'Chart',
        'order-depth': 'Orderbook/Depth Chart',
        'time-sale': 'Times and Sales',
        'limit-market': 'Limit Trade/Market Trade',
        'open-order': 'Open Orders',
      },
      marketswitchvalue: false,
      favoritesswitchvalue: false,
      checkedorange: false,
    }
  },
  computed: {
    ...mapState('market', ['header_settings', 'chart_orders_settings']),
    ...mapState(['checked']),
    header_settings_change() {
      return this.$store.state.market.header_settings
    },
    chart_orders_settings_change() {
      return this.$store.state.market.chart_orders_settings
    },
  },
  methods: {
    headerUpdateState() {
      this.$store.commit('market/setHeaderSettings', this.header_settings)
    },
    chartOrdersUpdateState() {
      this.$store.commit(
        'market/setChartOrdersSettings',
        this.chart_orders_settings
      )
    },
    initiateState() {
      this.$store.commit('market/setHeaderSettingsDefault')
      this.$store.commit(
        'market/setChartOrdersSettingsDefault',
        this.header_settings
      )
    },
  },
}
</script>

<style lang="scss">
.body-container {
  position: fixed;
  left: 0;
  top: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(22, 22, 23, 0.8);
}
.mt-30 {
  margin-top: 30px;
}
.preview-title {
  padding-top: 10px;
  padding-right: 10px;
  font-size: 12px;
  color: var(--cancel);
}

.module-name {
  margin: 3px 0;
}
.tooltip-desc {
  border-radius: 10px;
  color: white;
  background-color: rgb(22, 22, 23);
  transform: translate(23px, -160px);
  z-index: 999;
  width: 270px;
  padding: 15px;
  position: absolute;
  display: none;
  font-size: 14px;
}
.module-name:hover p {
  display: block;
}
.tooltip-desc {
  border-radius: 10px;
  color: white;
  background-color: rgb(22, 22, 23);
  transform: translate(23px, -160px);
  z-index: 999;
  width: 270px;
  padding: 15px;
  position: absolute;
  display: none;
  font-size: 14px;
}
.module-name:hover p {
  display: block;
}

.table-setting-modal {
  width: 649px;
  height: 630px;
  position: absolute;
  padding: 0 0 0 18px;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: var(--table-background);
}
.settings-title {
  font-size: 12px;
  color: var(--cancel);
}

.setting-container {
  padding-top: 18px;
}

span.theme-title,
.module-title {
  font-size: 12px;
}

el-container.setting-theme {
  flex-direction: column;
}

/* radio button */
/* completely hiding radio button */
input[type='radio'] {
  display: none;
}

/* simulate radiobutton appearance using pseudoselector */
input[type='radio'] + label:before {
  content: '';
  /* create custom radiobutton appearance */
  display: inline-block;
  width: 14px;
  height: 14px;
  padding: 3px;
  margin-right: 5px;
  /* background-color only for content */
  border: 1px solid #000000;
  background-color: #161617;
  border-radius: 50%;
}

/* appearance of checked radiobutton */
input[type='radio']:checked + label:before {
  background-color: #67c23a;
}

/* optional styles for centering radiobuttons */
.default-radio label {
  display: inline-flex;
  align-items: center;
  font-size: 14px;
}

.static-color-picker {
  width: 16px;
  height: 16px;
  padding: 2px;
  margin: 1px;
  background-color: white;
}

.theme-dark .el-main,
.theme-contrast .el-main,
.theme-oranger .el-main,
.theme-oceano .el-main,
.theme-cyber .el-main,
.theme-bloom .el-main {
  padding: 8px 12px 8px 12px !important;
  &.main-settings-left {
    padding-right: 33px !important;
  }
  &.main-settings-right {
    margin-right: 18px !important;
  }
}

.theme-list {
  margin: 3px 0px 3px 0px;
  padding: 3px 0px 3px 0px;
}

.theme-dark .el-footer {
  padding: 0px 12px;
  box-sizing: border-box;
  flex-shrink: 0;
}

.theme-contrast .el-footer {
  padding: 0px 12px;
  box-sizing: border-box;
  flex-shrink: 0;
}

.theme-oranger .el-footer {
  padding: 0px 12px;
  box-sizing: border-box;
  flex-shrink: 0;
}

.theme-oceano .el-footer {
  padding: 0px 12px;
  box-sizing: border-box;
  flex-shrink: 0;
}

.theme-cyber .el-footer {
  padding: 0px 12px;
  box-sizing: border-box;
  flex-shrink: 0;
}

.theme-bloom .el-footer {
  padding: 0px 12px;
  box-sizing: border-box;
  flex-shrink: 0;
}

.theme-pickers {
  .default-green {
    background-color: #66c167;
  }
  .default-red {
    background-color: #f96c6c;
  }
  .contrast-green {
    background-color: #00b909;
  }
  .contrast-red {
    background-color: #c60606;
  }
  .oranger-blue {
    background-color: #1f8df9;
  }
  .oranger-brown {
    background-color: #dd7a2b;
  }
  .oceano-blue {
    background-color: #136b9a;
  }
  .oceano-white {
    background-color: #ffffff;
  }
  .cyber-green {
    background-color: #0cb825;
  }
  .cyber-red {
    background-color: #e80015;
  }
  .bloom-green {
    background-color: #00a308;
  }
  .bloom-red {
    background-color: #d62834;
  }
}

.text-picker {
  &.default-text {
    border: 1px solid #f2f2f2;
    color: #f2f2f2;
  }
  &.contrast-text {
    border: 1px solid #b2b2b2;
    color: #b2b2b2;
  }
  &.oranger-text {
    border: 1px solid #bbbbbb;
    color: #363d52;
  }
  &.oceano-text {
    border: 1px solid #17a3e8;
    color: #bbbbbb;
  }
  &.cyber-text {
    border: 1px solid #01494d;
    color: #01494d;
  }
  &.bloom-text {
    border: 1px solid #3b4959;
    color: #fc9d31;
  }
  background-color: #0c0c11;
  width: 16px;
  height: 16px;
  padding: 2px;
  margin: 1px;
  content: 'Aa';
  text-align: center;
  font-size: 12px;
  vertical-align: middle;
  line-height: 10px;
  padding-left: 0px;
}

.theme-dark .el-switch__core:after {
  background-color: #ffffff;
  content: '';
  position: absolute;
  top: 1px;
  left: 1px;
  border-radius: 4px;
  transition: all 0.3s;
  width: 12px;
  height: 12px;
}

.theme-contrast .el-switch__core:after {
  background-color: #ffffff;
  content: '';
  position: absolute;
  top: 1px;
  left: 1px;
  border-radius: 4px;
  transition: all 0.3s;
  width: 12px;
  height: 12px;
}

.theme-oranger .el-switch__core:after {
  background-color: #ffffff;
  content: '';
  position: absolute;
  top: 1px;
  left: 1px;
  border-radius: 4px;
  transition: all 0.3s;
  width: 12px;
  height: 12px;
}

.theme-oceano .el-switch__core:after {
  background-color: #ffffff;
  content: '';
  position: absolute;
  top: 1px;
  left: 1px;
  border-radius: 4px;
  transition: all 0.3s;
  width: 12px;
  height: 12px;
}

.theme-cyber .el-switch__core:after {
  background-color: #ffffff;
  content: '';
  position: absolute;
  top: 1px;
  left: 1px;
  border-radius: 4px;
  transition: all 0.3s;
  width: 12px;
  height: 12px;
}

.theme-bloom .el-switch__core:after {
  background-color: #ffffff;
  content: '';
  position: absolute;
  top: 1px;
  left: 1px;
  border-radius: 4px;
  transition: all 0.3s;
  width: 12px;
  height: 12px;
}

.theme-dark .el-switch__core {
  border-radius: 4px;
  height: 16px;
  width: 40px;
}

.theme-contrast .el-switch__core {
  border-radius: 4px;
  height: 16px;
  width: 40px;
}

.theme-oranger .el-switch__core {
  border-radius: 4px;
  height: 16px;
  width: 40px;
}

.theme-oceano .el-switch__core {
  border-radius: 4px;
  height: 16px;
  width: 40px;
}

.theme-cyber .el-switch__core {
  border-radius: 4px;
  height: 16px;
  width: 40px;
}

.theme-bloom .el-switch__core {
  border-radius: 4px;
  height: 16px;
  width: 40px;
}

.theme-dark .el-switch.is-checked .el-switch__core::after {
  left: 100%;
  margin-left: -13px;
}

.theme-contrast .el-switch.is-checked .el-switch__core::after {
  left: 100%;
  margin-left: -13px;
}

.theme-oranger .el-switch.is-checked .el-switch__core::after {
  left: 100%;
  margin-left: -13px;
}

.theme-oceano .el-switch.is-checked .el-switch__core::after {
  left: 100%;
  margin-left: -13px;
}

.theme-cyber .el-switch.is-checked .el-switch__core::after {
  left: 100%;
  margin-left: -13px;
}

.theme-bloom .el-switch.is-checked .el-switch__core::after {
  left: 100%;
  margin-left: -13px;
}

.module-name,
.module-footer {
  cursor: pointer;
  font-size: 14px;
}

.theme-dark .el-footer.module-footer {
  display: inline-block;
  background-color: rgba(56, 56, 56, 0.4);
  border-radius: 4px;
  color: #e0e0e0;
  width: 132px;
  padding: 12px 16px;
  font-size: 14px;
}

.module-list {
  padding: 2px 0px 2px 0px;
  margin: 2px 0px 2px 0px;
}

#preview_chart_container {
  height: 250px;
}
@media only screen and (max-width: 1000px) {
  #preview_chart_container {
    height: 360px;
  }
}
</style>
