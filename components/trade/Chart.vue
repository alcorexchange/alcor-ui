<template lang="pug">
  #tv_chart_container
</template>

<script>
import { mapState } from 'vuex'

export default {
  tvWidget: null,

  computed: {
    ...mapState('market', ['token', 'id']),
    ...mapState(['theme'])
  },

  watch: {
    theme() {
      this.mountChart()
    }
  },

  mounted() {
    this.mountChart()
  },

  methods: {
    mountChart() {
      const Widget = require('~/assets/charts/charting_library.min.js').widget

      const widgetOptions = {
        symbol: this.token.symbol.name,
        datafeed: {
          onReady: (callback) => {
            const data = { supported_resolutions: ['1', '15', '30', '60', '240', 'D', 'W', 'M'], symbols_types: [{ name: 'crypto', value: 1 }] }
            callback(data)
          },

          subscribeBars: () => {},

          resolveSymbol: (symbolName, onSymbolResolvedCallback, onResolveErrorCallback) => {
            const symbolInfo = {
              name: this.token.symbol.name,
              description: `${this.$store.state.network.baseToken.symbol}/${this.token.symbol.name}`,
              //type: symbolItem.type,
              session: '24x7',
              timezone: 'Etc/UTC',
              //exchange: symbolItem.exchange,
              minmov: 0.0000001,
              pricescale: 100000000,
              has_intraday: true,
              has_no_volume: false,
              has_weekly_and_monthly: true,
              supported_resolutions: ['1', '15', '30', '60', '240', 'D', 'W', 'M'],
              volume_precision: 5,
              data_status: 'streaming'
            }

            onSymbolResolvedCallback(symbolInfo)
          },
          getBars: async (symbolInfo, resolution, from, to, onHistoryCallback, onErrorCallback, firstDataRequest) => {
            const { data: charts } = await this.$store.getters['api/backEnd'].get(`/api/markets/${this.id}/charts`, {
              params: { resolution, from, to }
            })

            const bars = charts.map((i) => {
              return {
                time: i.time * 1000,
                open: i.open,
                high: i.high,
                low: i.low,
                close: i.close,
                volume: i.volume
              }
            })
            onHistoryCallback(bars, { noData: bars.length == 0 })
          },
          //subscribeBars: (symbolInfo, resolution, onRealtimeCallback, subscribeUID, onResetCacheNeededCallback) => {
          //  console.log('[subscribeBars]: Method call with subscribeUID:', subscribeUID)
          //},
          //unsubscribeBars: (subscriberUID) => {
          //  console.log('[unsubscribeBars]: Method call with subscriberUID:', subscriberUID)
          //}
        },
        //datafeed: new window.Datafeeds.UDFCompatibleDatafeed(this.datafeedUrl), for test
        interval: 'D',
        container_id: 'tv_chart_container',
        library_path: '/charting_library/',
        favorites: {
          intervals: ['1', '15', '30', '60', '240', 'D', 'W', 'M']
        },
        locale: 'en', // TODO Change lang
        disabled_features: [
          //'header_resolutions',
          'header_symbol_search',
          'header_chart_type',
          'header_settings',
          'header_compare',
          'header_undo_redo',
          'header_screenshot',
          //'header_fullscreen_button',
          'compare_symbol',
          'border_around_the_chart',
          'header_saveload',
          'control_bar',

          'symbol_search_hot_key',
          //'left_toolbar',

          //'legend_widget',
          'edit_buttons_in_legend',
          'create_volume_indicator_by_default',
          'cropped_tick_marks',
          //'context_menus',


          'edit_buttons_in_legend',
          'main_series_scale_menu',
          'trading_notifications',
          'show_trading_notifications_history',
          'cropped_tick_marks',
          'end_of_period_timescale_marks',
          //'volume_force_overlay',
          'datasource_copypaste',
          'chart_crosshair_menu',
          'shift_visible_range_on_new_bar',
          'go_to_date',
          'timezone_menu',
          'property_pages',
          'timeframes_toolbar',
          'countdown'

          //'use_localstorage_for_settings',
        ],
        enabled_features: ['side_toolbar_in_fullscreen_mode', 'header_in_fullscreen_mode'],
        //charts_storage_url: this.chartsStorageUrl,
        //charts_storage_api_version: this.chartsStorageApiVersion,
        //client_id: this.clientId,
        //user_id: this.userId,
        fullscreen: false,
        autosize: true,
        studies_overrides: this.studiesOverrides,

        // Styles
        theme: this.theme,
        custom_css_url: '/tv_themed.css',
        overrides: {
          'paneProperties.background': this.theme == 'light' ? '#F3FAFC' : '#192427',
          'scalesProperties.textColor': this.theme == 'light' ? '#4a4a4a' : '#9EABA3'
        }
      }

      const widget = new Widget(widgetOptions)
      this.tvWidget = widget
    }
  }
}
</script>

<style>
#tv_chart_container {
  height: 460px;
}
</style>
