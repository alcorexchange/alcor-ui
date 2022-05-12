<template lang="pug">
.setting-modal
  .el-container.setting-container.pt-2.d-flex.flex-column
    .el-container.setting-theme.d-flex.flex-column
      .setting-theme-footer.el-footer.text-white
        span.theme-title Theme
      .el-main.theme-main-settings
        .theme-selection.d-flex.flex-column
          .theme-list.d-flex.flex-row.justify-content-between
            .default-radio
              input#soundsignal1(
                type='radio',
                value='dark',
                name='soundsignal',
                checked=checked,
                @change='onChange($event)'
              )
              label(for='soundsignal1') Default
            .theme-pickers.d-flex.flex-row
              .text-picker.default-text.mx-1 Aa
              .static-color-picker.default-green.mx-1
              .static-color-picker.default-red.mx-1
          .theme-list.d-flex.flex-row.justify-content-between
            .default-radio
              input#soundsignal2(
                type='radio',
                value='contrast',
                name='soundsignal',
                @change='onChange($event)'
              )
              label(for='soundsignal2') Contrast
            .theme-pickers.d-flex.flex-row
              .text-picker.contrast-text.mx-1 Aa
              .static-color-picker.contrast-green.mx-1
              .static-color-picker.contrast-red.mx-1
          .theme-list.d-flex.flex-row.justify-content-between
            .default-radio
              input#soundsignal3(
                type='radio',
                value='oranger',
                name='soundsignal',
                checked=checkedorange,
                @change='onChange($event)'
              )
              label(for='soundsignal3') Oranger
            .theme-pickers.d-flex.flex-row
              .text-picker.oranger-text.mx-1 Aa
              .static-color-picker.oranger-blue.mx-1
              .static-color-picker.oranger-brown.mx-1
          .theme-list.d-flex.flex-row.justify-content-between
            .default-radio
              input#soundsignal4(
                type='radio',
                value='oceano',
                name='soundsignal',
                @change='onChange($event)'
              )
              label(for='soundsignal4') Oceano
            .theme-pickers.d-flex.flex-row
              .text-picker.oceano-text.mx-1 Aa
              .static-color-picker.oceano-blue.mx-1
              .static-color-picker.oceano-white.mx-1
          .theme-list.d-flex.flex-row.justify-content-between
            .default-radio
              input#soundsignal5(
                type='radio',
                value='cyber',
                name='soundsignal',
                @change='onChange($event)'
              )
              label(for='soundsignal5') Cyber
            .theme-pickers.d-flex.flex-row
              .text-picker.cyber-text.mx-1 Aa
              .static-color-picker.cyber-green.mx-1
              .static-color-picker.cyber-red.mx-1
          .theme-list.d-flex.flex-row.justify-content-between
            .default-radio
              input#soundsignal6(
                type='radio',
                value='bloom',
                name='soundsignal',
                @change='onChange($event)'
              )
              label(for='soundsignal6') Bloom
            .theme-pickers.d-flex.flex-row
              .text-picker.bloom-text.mx-1 Aa
              .static-color-picker.bloom-green.mx-1
              .static-color-picker.bloom-red.mx-1
    hr(
      style='width: 90%; text-align: center; background-color: gray; margin-top: -9px; margin-bottom: 9px'
    )
    .el-container.setting-layout.d-flex.flex-column
      .setting-module-footer.el-footer.text-white
        span.module-title Layout Modules
      .el-main.module-main-settings
        .module-selection.d-flex.flex-column
          .module-list.d-flex.flex-row.justify-content-between(
            v-for='settingBtn in markets_layout'
          )
            .module-name {{ settingBtnTitles[settingBtn.i] }}
            .module-pickers.d-flex.flex-row
              el-switch(
                v-model='settingBtn.status',
                @change='updateState()',
                active-color='#13ce66',
                inactive-color='#161617'
              )
          //.module-list.d-flex.flex-row.justify-content-between
            .module-name Markets
            .module-pickers.d-flex.flex-row
              el-switch(
                v-model='marketswitchvalue',
                active-color='#13ce66',
                inactive-color='#161617'
              )
          //.module-list.d-flex.flex-row.justify-content-between
            .module-name Favorites
            .module-pickers.d-flex.flex-row
              el-switch(
                v-model='favoritesswitchvalue',
                active-color='#13ce66',
                inactive-color='#161617'
              )
      .el-footer.module-footer.default-settings-part
        .return-default-setting(@click='initiateState()') Return to Default Settings
</template>

<script>
import { mapState } from 'vuex'
import TokenImage from '~/components/elements/TokenImage'
import ChangePercent from '~/components/trade/ChangePercent'

export default {
  scrollToTop: false,

  components: {
    TokenImage,
    ChangePercent
  },

  data() {
    return {
      settingBtnTitles: {
        chart: 'Chart',
        'order-depth': 'Orderbook/Depth Chart',
        'time-sale': 'Times and Sales',
        'limit-market': 'Limit Trade/Market Trade',
        'open-order': 'Open Orders',
        markets: 'Markets'
      },
      marketswitchvalue: false,
      favoritesswitchvalue: false,
      checkedorange: false
    }
  },
  computed: {
    ...mapState(['markets']),
    ...mapState(['checked']),
    markets_layout: {
      get() {
        if (this.$store.state.market.markets_layout != null) {
          return this.$store.state.market.markets_layout
        } else {
          const defaultlayout = [
            {
              x: 0,
              y: 0,
              w: 14,
              h: 14,
              i: 'chart',
              status: true,
              mw: 9,
              mh: 9
            },
            {
              x: 14,
              y: 0,
              w: 5,
              h: 14,
              i: 'order-depth',
              status: true,
              mw: 5,
              mh: 9
            },
            {
              x: 19,
              y: 0,
              w: 5,
              h: 14,
              i: 'time-sale',
              status: true,
              mw: 3,
              mh: 9
            },
            {
              x: 0,
              y: 14,
              w: 14,
              h: 8,
              i: 'open-order',
              status: true,
              mw: 10,
              mh: 7
            },
            {
              x: 14,
              y: 14,
              w: 10,
              h: 8,
              i: 'limit-market',
              status: true,
              mw: 8,
              mh: 8
            },
            {
              x: 14,
              y: 14,
              w: 5,
              h: 8,
              i: 'markets',
              status: false,
              mw: 5,
              mh: 5
            }
          ]
          return defaultlayout
        }
      },

      set(value) {
        this.$store.commit('market/setMarketLayout', value)
      }
    }
  },
  methods: {
    onChange(e) {
      this.$store.dispatch('dynamicTheme', e.target.value)
      if (e.target.value == 'oranger') this.checkedorange = true
    },
    updateState() {
      this.$store.commit('market/setMarketLayout', this.markets_layout)
    },
    initiateState() {
      this.markets_layout = [
        {
          x: 0,
          y: 0,
          w: 14,
          h: 14,
          i: 'chart',
          status: true,
          mw: 9,
          mh: 9
        },
        {
          x: 14,
          y: 0,
          w: 5,
          h: 14,
          i: 'order-depth',
          status: true,
          mw: 5,
          mh: 9
        },
        {
          x: 19,
          y: 0,
          w: 5,
          h: 14,
          i: 'time-sale',
          status: true,
          mw: 5,
          mh: 9
        },
        {
          x: 0,
          y: 14,
          w: 14,
          h: 8,
          i: 'open-order',
          status: true,
          mw: 10,
          mh: 7
        },
        {
          x: 14,
          y: 14,
          w: 10,
          h: 8,
          i: 'limit-market',
          status: true,
          mw: 6,
          mh: 7
        },
        {
          x: 14,
          y: 14,
          w: 5,
          h: 8,
          i: 'markets',
          status: false,
          mw: 5,
          mh: 5
        }
      ]
    }
  }
}
</script>

<style lang="scss">
.markets-bar {
  height: 100%;
}

.theme-dark {
  .markets-bar .el-table {
    th,
    tr {
      background: var(--background-color-base);
    }

    .el-table__row {
      &:hover {
        & td,
        & th,
        & tr {
          background: var(--btn-active) !important;
        }
      }
    }

    .active-row {
      & td,
      & th,
      & tr {
        background: var(--btn-active) !important;
      }
    }
  }
}

.setting-modal {
  height: auto;
  width: 288px;
  background-color: white;
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

.theme-dark .el-main {
  padding: 8px 12px 8px 12px !important;
}

.theme-contrast .el-main {
  padding: 8px 12px 8px 12px !important;
}

.theme-oranger .el-main {
  padding: 8px 12px 8px 12px !important;
}

.theme-oceano .el-main {
  padding: 8px 12px 8px 12px !important;
}

.theme-cyber .el-main {
  padding: 8px 12px 8px 12px !important;
}

.theme-bloom .el-main {
  padding: 8px 12px 8px 12px !important;
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

.module-footer.default-settings-part {
  color: #1fc781;
  width: auto;
  background: none !important;
  width: 100% !important;
  padding: 16px 16px !important;
}

.return-default-setting:hover {
  color: #1fc781;
}

.module-list {
  padding: 2px 0px 2px 0px;
  margin: 2px 0px 2px 0px;
}
</style>
