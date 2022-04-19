<template lang="pug">
.setting-modal
  .el-container.setting-container.pt-2.d-flex.flex-column
    .el-container.setting-theme.d-flex.flex-column
      .setting-theme-footer.el-footer.text-white
        span.theme-title Theme
      .el-main.theme-main-settings
        .theme-selection.d-flex.flex-column
          .theme-list.option-theme
            b-dropdown(:text='selected ? selected.text : `<div>sunsun</div>`')
              b-dropdown-item(
                :disabled='option.disabled',
                @click='select(option)',
                v-for='option in options',
                :key='option.value'
              )
                .theme-list.d-flex.flex-row.justify-content-between
                  label(for='soundsignal1') Default
                  .theme-pickers.d-flex.flex-row
                    .text-picker.default-text.mx-1 Aa
                    .static-color-picker.default-green.mx-1
                    .static-color-picker.default-red.mx-1
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
    hr(
      style='width: 90%; text-align: center; background-color: gray; margin-top: -9px; margin-bottom: 9px'
    )
    .el-container.setting-nodes.d-flex.flex-column
      .active-nodes-box
        .nodes-label.pb-1 Nodes
        .nodes-switch.inline-flex.pr-2.py-2
          el-switch.pr-2(
            v-model='nodes',
            @change='',
            active-color='#13ce66',
            inactive-color='#161617'
          )
          .node-label Automatically select(5)
        .node-active-label.pb-2 Active node
        .node-active.d-flex.flex-row.justify-content-between
          .current-node-name-link.d-flex.flex-column
            .node-active-name Western Europe-Germany-Falkenstein
            .node-active-link wss://node.gph.ai
          .node-active-time.active-standard 424.2ms
          .active-node-status.d-flex
            img.logo(height='44', src='~/assets/logos/nodeactive.svg', alt='')
      el-tabs.h-100(type='border-card', size='small')
        el-tab-pane(label='Available Nodes')
          AvailableNodes
        el-tab-pane(label='Personal Nodes')
          PersonalNodes
</template>

<script>
import { mapState } from 'vuex'
import Vue from 'vue'
import BootstrapVue from 'bootstrap-vue'
import TokenImage from '~/components/elements/TokenImage'
import ChangePercent from '~/components/trade/ChangePercent'
import AvailableNodes from '~/components/trade/AvailableNodes'
import PersonalNodes from '~/components/trade/PersonalNodes'
Vue.use(BootstrapVue)

export default {
  scrollToTop: false,

  components: {
    TokenImage,
    ChangePercent,
    AvailableNodes,
    PersonalNodes,
  },

  data() {
    return {
      settingBtnTitles: {
        chart: 'Chart',
        'order-depth': 'Orderbook/Depth Chart',
        'time-sale': 'Times and Sales',
        'limit-market': 'Limit Trade/Market Trade',
        'open-order': 'Open Orders',
        markets: 'Markets',
        favorites: 'Favorites',
      },
      marketswitchvalue: false,
      favoritesswitchvalue: false,
      checkedorange: false,
      selected: null,
      options: [
        {
          value: null,
          text: 'default',
        },
        {
          value: 'a',
          text: 'This is First option',
        },
        {
          value: 'b',
          text: 'Default Selected Option',
        },
        {
          value: 'c',
          text: 'This is another option',
        },
        {
          value: 'd',
          text: 'This one is disabled',
        },
      ],
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
              mh: 9,
            },
            {
              x: 14,
              y: 0,
              w: 5,
              h: 14,
              i: 'order-depth',
              status: true,
              mw: 5,
              mh: 9,
            },
            {
              x: 19,
              y: 0,
              w: 5,
              h: 14,
              i: 'time-sale',
              status: true,
              mw: 3,
              mh: 9,
            },
            {
              x: 0,
              y: 14,
              w: 14,
              h: 8,
              i: 'open-order',
              status: true,
              mw: 10,
              mh: 7,
            },
            {
              x: 14,
              y: 14,
              w: 10,
              h: 8,
              i: 'limit-market',
              status: true,
              mw: 8,
              mh: 8,
            },
            {
              x: 14,
              y: 14,
              w: 5,
              h: 8,
              i: 'markets',
              status: false,
              mw: 5,
              mh: 5,
            },
          ]
          return defaultlayout
        }
      },

      set(value) {
        this.$store.commit('market/setMarketLayout', value)
      },
    },
  },
  mounted() {
    document.getElementsByClassName(
      'btn dropdown-toggle btn-secondary'
    )[0].innerHTML =
      '<div class="theme-list d-flex flex-row justify-content-between"><label for="soundsignal1">Default</label><div class="theme-pickers d-flex flex-row"><div class="text-picker default-text mx-1">Aa</div><div class="static-color-picker default-green mx-1"></div><div class="static-color-picker default-red mx-1"></div></div></div>'
  },
  methods: {
    onChange(e) {
      this.$store.dispatch('dynamicTheme', e.target.value)
      if (e.target.value == 'oranger') this.checkedorange = true
    },
    select(option) {
      this.selected = option
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
          mh: 9,
        },
        {
          x: 14,
          y: 0,
          w: 5,
          h: 14,
          i: 'order-depth',
          status: true,
          mw: 5,
          mh: 9,
        },
        {
          x: 19,
          y: 0,
          w: 5,
          h: 14,
          i: 'time-sale',
          status: true,
          mw: 5,
          mh: 9,
        },
        {
          x: 0,
          y: 14,
          w: 14,
          h: 8,
          i: 'open-order',
          status: true,
          mw: 10,
          mh: 7,
        },
        {
          x: 14,
          y: 14,
          w: 10,
          h: 8,
          i: 'limit-market',
          status: true,
          mw: 6,
          mh: 7,
        },
        {
          x: 14,
          y: 14,
          w: 5,
          h: 8,
          i: 'markets',
          status: false,
          mw: 5,
          mh: 5,
        },
        {
          x: 14,
          y: 14,
          w: 5,
          h: 8,
          i: 'favorites',
          status: false,
          mw: 5,
          mh: 5,
        },
      ]
    },
  },
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
  width: 360px;
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

.el-container.setting-theme {
  margin-bottom: 16px;
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

.theme-list.option-theme {
  margin: 6px 0px 6px 0px;
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
  justify-content: center;
  align-items: center;
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

.node-active {
  .node-active-name {
    font-size: 14px;
    color: #f2f2f2;
  }
  .node-active-link {
    font-size: 10px;
    color: #bdbdbd;
  }
  .node-active-time {
    font-size: 12px;
    &.active-standard {
      color: #d0da59;
    }
    &.active-warning {
      color: #f96c6c;
    }
  }
  .active-node-status {
    margin-top: 3px;
    img {
      width: 12px;
      height: 12px;
    }
  }
}
.active-nodes-box {
  padding: 8px 12px 26px 12px;
}

.nodes-label {
  font-size: 12px;
  line-height: 14.06px;
  color: #c4c4c4;
  line-height: 16.41px;
}

.node-label {
  font-size: 14px;
  color: #f2f2f2;
}
.node-active-label {
  font-family: 'Roboto';
  font-style: normal;
  font-weight: 400;
  font-size: 12px;
  line-height: 14px;
  color: #c4c4c4;
}
.nodes-switch.inline-flex {
  display: inline-flex;
}
.theme-list.option-theme {
  ul {
    list-style-type: none;
    padding: 0;
  }
  li {
    display: inline-block;
    width: 100%;
    background: #282828;
  }
  a {
    color: #42b983;
  }
  button::after {
    position: absolute;
    right: 9px;
    top: 9px;
  }
  button {
    background: #161617 !important;
    border-radius: 2px !important;
    height: 24px;
    border: none;
    .theme-list {
      width: 95%;
    }
    align-items: center;
    display: flex;
    justify-content: center;
  }

  .dropdown {
    width: 100% !important;
    background: #282828;
  }
}

.theme-main-settings {
  overflow: inherit !important;
}
</style>
