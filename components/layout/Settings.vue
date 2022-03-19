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
          .module-list.d-flex.flex-row.justify-content-between
            .module-name Chart
            .module-pickers.d-flex.flex-row
              el-switch(
                v-model='switchvalue1',
                active-color='#13ce66',
                inactive-color='#161617'
              )
          .module-list.d-flex.flex-row.justify-content-between
            .module-name Orderbook/Depth Chart
            .module-pickers.d-flex.flex-row
              el-switch(
                v-model='switchvalue2',
                active-color='#13ce66',
                inactive-color='#161617'
              )
          .module-list.d-flex.flex-row.justify-content-between
            .module-name Times and Sales
            .module-pickers.d-flex.flex-row
              el-switch(
                v-model='switchvalue3',
                active-color='#13ce66',
                inactive-color='#161617'
              )
          .module-list.d-flex.flex-row.justify-content-between
            .module-name Limit Trade/Market Trade
            .module-pickers.d-flex.flex-row
              el-switch(
                v-model='switchvalue4',
                active-color='#13ce66',
                inactive-color='#161617'
              )
          .module-list.d-flex.flex-row.justify-content-between
            .module-name Open Orders
            .module-pickers.d-flex.flex-row
              el-switch(
                v-model='switchvalue5',
                active-color='#13ce66',
                inactive-color='#161617'
              )
          .module-list.d-flex.flex-row.justify-content-between
            .module-name Markets
            .module-pickers.d-flex.flex-row
              el-switch(
                v-model='switchvalue6',
                active-color='#13ce66',
                inactive-color='#161617'
              )
          .module-list.d-flex.flex-row.justify-content-between
            .module-name Favorites
            .module-pickers.d-flex.flex-row
              el-switch(
                v-model='switchvalue7',
                active-color='#13ce66',
                inactive-color='#161617'
              )
      .el-footer.module-footer(@click='initiateState()') Return to Default Settings
</template>

<script>
import { mapState } from 'vuex'
import TokenImage from '~/components/elements/TokenImage'
import ChangePercent from '~/components/trade/ChangePercent'

export default {
  scrollToTop: false,

  components: {
    TokenImage,
    ChangePercent,
  },

  data() {
    return {
      search: '',
      loading: false,
      switchvalue1: true,
      switchvalue2: true,
      switchvalue3: true,
      switchvalue4: true,
      switchvalue5: true,
      switchvalue6: false,
      switchvalue7: false,
      radio: '1',
      checked: true,
      checkedorange: false,
    }
  },
  computed: {
    ...mapState(['markets']),
    ...mapState(['checked']),
    ...mapState('settings', ['favMarkets']),
  },
  methods: {
    onChange(e) {
      console.log('event value>>>>>>>: orange', e.target.value)
      this.$store.dispatch('dynamicTheme', e.target.value)
      if (e.target.value == 'oranger') this.checkedorange = true
    },
  },
}
</script>

<style lang="scss">
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
  height: 549px;
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
  font-size: 14px;
}

.module-footer {
  color: #1fc781;
}

.module-list {
  padding: 2px 0px 2px 0px;
  margin: 2px 0px 2px 0px;
}
</style>
