<template lang="pug">
.setting-modal
  .el-container.setting-container.pt-2.d-flex.flex-column
    .el-container.d-flex.flex-column
      .setting-theme-footer.el-footer.text-white
        span.theme-title {{ $t('Language') }}
      .el-main.theme-main-settings
        element-select(:options="$i18n.locales")
          template(#option="{ option }")
            lang-option(:code="option.code")
          template(#selected)
            lang-option(:code="$i18n.locale")

    div(v-if="$route.name == `trade-index-id___${$i18n.locale}`")
      .setting-theme-footer.el-footer.text-white
        span.theme-title {{ $t('Theme') }}
      .el-main.theme-main-settings
        element-select(:options="Object.values(themes)")
          template(#option="{ option }")
            theme-option(:theme="option" @click="changeSelected")
          template(#selected)
            theme-option(:theme="tradeTheme")

    //.el-container.setting-theme.d-flex.flex-column
      .setting-theme-footer.el-footer.text-white
        span.theme-title Theme
      .el-main.theme-main-settings
        el-dropdown(trigger="click").theme-dropdown
          .active
            span Default

            .theme-pickers.d-flex.flex-row.ml-auto
              .text-picker.default-text.mx-1 Aa
              .static-color-picker.default-green.mx-1
              .static-color-picker.default-red.mx-1

            i.el-icon-arrow-down

          template(#dropdown='')
            el-dropdown-menu.theme-dropdown-container
              .d-item
                span Contrast
                .theme-pickers.d-flex.flex-row.ml-auto
                  .text-picker.contrast-text.mx-1 Aa
                  .static-color-picker.contrast-green.mx-1
                  .static-color-picker.contrast-red.mx-1

              .d-item
                span Oranger
                .theme-pickers.d-flex.flex-row.ml-auto
                  .text-picker.oranger-text.mx-1 Aa
                  .static-color-picker.oranger-blue.mx-1
                  .static-color-picker.oranger-brown.mx-1

        //.theme-selection.d-flex.flex-column
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

    .el-container.setting-layout.d-flex.flex-column(v-if="!isMobile && $route.name == `trade-index-id___${$i18n.locale}`")
      .setting-module-footer.el-footer.text-white
        span.module-title {{ $t('Layouts') }}
      .el-main.module-main-settings
        .layout-selection
          .d-flex.flex-column(@click="setMarketLayout('classic')")
            img(v-if="$colorMode.value === 'dark'" src=`~/assets/icons/classic_layout.svg` height=70 :class="{ active: current_market_layout == 'classic' }")
            img(v-else src=`~/assets/icons/classic_layout_light.svg` height=70 :class="{ active: current_market_layout == 'classic' }")
            span {{ $t('Classic') }}
          .d-flex.flex-column(@click="setMarketLayout('advanced')")
            img(v-if="$colorMode.value === 'dark'" src=`~/assets/icons/modern_layout.svg` height=70 :class="{ active: current_market_layout == 'advanced' }")
            img(v-else src=`~/assets/icons/modern_layout_light.svg` height=70 :class="{ active: current_market_layout == 'advanced' }")

            span {{ $t('Advanced') }}
          .d-flex.flex-column(@click="setMarketLayout('full')")
            img(v-if="$colorMode.value === 'dark'" src=`~/assets/icons/classic_layout.svg` height=70 :class="{ active: current_market_layout == 'full' }")
            img(v-else src=`~/assets/icons/classic_layout_light.svg` height=70 :class="{ active: current_market_layout == 'full' }")

            span {{ $t('FullScreen') }}

    .el-container.setting-layout.d-flex.flex-column(v-if="!isMobile && current_market_layout == 'advanced' && $route.name == `trade-index-id___${$i18n.locale}`")
      hr(style='width: 90%; text-align: center; background-color: rgba(120, 120, 135, 0.36); margin-top: 5px; margin-bottom: 9px')
      .setting-module-footer.el-footer.text-white
        span.module-title {{ $t('Layout Modules') }}
      .el-main.module-main-settings
        .module-selection.d-flex.flex-column
          .module-list.d-flex.flex-row.justify-content-between(
            v-for='layout in markets_layout'
          )
            .module-name {{ $t(settingBtnTitles[layout.i]) }}
            .module-pickers.d-flex.flex-row
              el-switch(
                :value='layout.status',
                @change='setStatus(layout, !layout.status)',
                active-color='#13ce66',
                inactive-color='#161617'
              )
      .el-footer.module-footer.default-settings-part
        .return-default-setting.hoverable(@click='initiateState()') {{ $t('Return to Default Settings') }}

    // TODO
    //.el-container.setting-layout.d-flex.flex-column
      .setting-module-footer.el-footer.text-white
        span.module-title Nodes
      .el-main.module-main-settings
        .layout-selection
          el-switch(v-model='auto_select_node' active-color='#13ce66' active-text=' Automatically select')

      .setting-module-footer.el-footer.text-white
        span.module-title Active node

        .module-selection.d-flex.flex-column.mt-2
          div
            div Node

          //.module-list.d-flex.flex-row.justify-content-between(
            v-for='settingBtn in markets_layout')
            .module-name {{ settingBtnTitles[settingBtn.i] }}
            .module-pickers.d-flex.flex-row
              el-switch(
                v-model='settingBtn.status',
                @change='updateState()',
                active-color='#13ce66',
                inactive-color='#161617'
              )

</template>

<script>
import { mapState } from 'vuex'
import TokenImage from '~/components/elements/TokenImage'
import ChangePercent from '~/components/trade/ChangePercent'
import ElementSelect from '~/components/elements/ElementSelect'
import LangOption from '~/components/LangOption'
import ThemeOption from '~/components/ThemeOption'

import { TRADE_LAYOUTS } from '~/config'

export default {
  scrollToTop: false,

  components: {
    TokenImage,
    ChangePercent,
    ElementSelect,
    LangOption,
    ThemeOption
  },

  data() {
    return {
      settingBtnTitles: {
        'favorites-top-line': 'Favorite Top Line',
        chart: 'Chart',
        'order-depth': 'Orderbook/Depth Chart',
        'time-sale': 'Times and Sales',
        'limit-market': 'Horizontal Order Form',
        'open-order': 'Open Orders',
        markets: 'Markets',
        'order-form-vertical': 'Vertical Order Form'
      },

      marketswitchvalue: false,
      favoritesswitchvalue: false,
      checkedorange: false,

      themes: {
        default: {
          value: 'Default',
          colors: ['#66C167', '#F96C6C'],
          textPicker: { bg: '#3F3F3F', color: '#f2f2f2' }
        },
        bloom: {
          value: 'Bloom',
          colors: ['#277DFA', '#FFAB2E'],
          textPicker: { bg: '#3F3F3F', color: '#f2f2f2' }
        },
        cyber: {
          value: 'Cyber',
          colors: ['#F22B55', '#00AB4A'],
          textPicker: { bg: '#3F3F3F', color: '#f2f2f2' }
        },
        contrast: {
          value: 'Contrast',
          colors: ['#C60606', '#00B909'],
          textPicker: { bg: '#3F3F3F', color: '#f2f2f2' }
        }
      }
    }
  },
  computed: {
    ...mapState(['markets']),
    ...mapState('market', ['current_market_layout', 'markets_layout']),
    ...mapState('settings', ['tradeColor']),

    tradeTheme() {
      return this.themes[this.tradeColor]
    },

    auto_select_node: {
      get() {
        return this.$store.state.settings.auto_node_select
      },

      set(value) {
        return this.$store.commit('settings/setAutoNodeSelect', value)
      }
    },

    markets_layout_settings() {
      return TRADE_LAYOUTS.advanced.map(item => {
        const existed = this.markets_layout.filter(i => i.i == item.i)[0]

        if (item.status && !existed) {
          item.status = false
        }

        if (existed) {
          item.status = existed.status
        }

        return item
      })
    }
  },

  methods: {
    setMarketLayout(value) {
      if (value === 'advanced')
        document.querySelector('.main').classList.add('unlim-width')
      else
        document.querySelector('.main').classList.remove('unlim-width')

      this.$store.commit('market/setCurrentMarketLayout', value)
    },

    changeSelected(value) {
      this.$store.commit('settings/setTradeColor', value)
      window.localStorage.setItem('trade-theme', value)
      document.querySelector('html').setAttribute('trade-theme', window.localStorage.getItem('trade-theme'))
    },

    onChange(e) {
      this.$store.dispatch('dynamicTheme', e.target.value)
      if (e.target.value == 'oranger') this.checkedorange = true
    },

    setStatus(layout, status) {
      const current = JSON.parse(JSON.stringify(this.markets_layout))

      current.map((item) => {
        if (item.i == layout.i) {
          item.status = status
        }
      })

      this.$store.commit('market/setMarketLayout', current)
    },

    initiateState() {
      this.$store.commit('market/setMarketToDefault')
    }
  },
}
</script>

<style scoped lang="scss">
.layout-selection {
  display: flex;
  justify-content: space-between;
  align-items: center;
  text-align: center;
  border-radius: 2px;
  box-sizing: border-box;

  img {
    cursor: pointer;

    &:hover {
      border: 1px solid #1fc7816e;
    }

    &.active {
      border: 1px solid #1FC781;
    }
  }

  span {
    margin-top: 5px;

    color: #f2f2f2;

    font-size: 12px;
    line-height: 14px;
  }
}
</style>

<style lang="scss">
.unlim-width {
  max-width: 100% !important;
}

.setting-lang {
  padding: 0 12px;
}

.markets-bar {
  height: 100%;
}

.setting-modal {
  height: auto;
  width: 288px;
  background-color: white;

  .el-switch__label {
    color: var(--text-default);
  }
}

.setting-container {
  padding-top: 18px;
}

span.theme-title,
.module-title {
  font-size: 12px;
  color: var(--text-default);
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
input[type='radio']+label:before {
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
input[type='radio']:checked+label:before {
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

.el-main {
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

.el-footer {
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

.return-default-setting {
  color: var(--secondary-green);
}

.module-list {
  padding: 2px 0px 2px 0px;
  margin: 2px 0px 2px 0px;
}

.theme-dropdown {
  width: 100%;

  .el-dropdown-selfdefine {
    width: 100%;
    display: flex;
    padding: 2px 10px;
    background: var(--bg-alter-1);
    align-items: center;
  }
}

.el-dropdown-menu.theme-dropdown-container {
  padding: 0px;
  background: var(--bg-alter-1);
  border: 2px solid rgb(63, 63, 63);
}

.theme-dropdown-container {
  .d-item {
    display: flex;
    cursor: pointer;
    width: 260px;
    padding: 3px 10px;
    align-items: center;
  }

  .d-item:hover {
    background: var(--btn-default);
  }
}
</style>
