<template lang="pug">
  #tv_chart_container
</template>

<script>
// TODO Зафиксить график при переключении
import { mapState } from 'vuex'

const resolutions = {
  1: 1 * 60,
  5: 5 * 60,
  15: 15 * 60,
  30: 30 * 60,
  60: 60 * 60,
  240: 60 * 60 * 4,
  '1D': 60 * 60 * 24,
  '1W': 60 * 60 * 24 * 7,
  '1M': 60 * 60 * 24 * 30
}

export default {
  data() {
    return {
      resolution: 240,

      onRealtime: null,
      widget: null,
      onResetCacheNeededCallback: null
    }
  },

  computed: {
    ...mapState('market', ['base_token', 'id', 'quote_token']),
    ...mapState(['network'])
  },

  watch: {
    '$colorMode.value'() {
      this.mountChart()
    },

    id(to, from) {
      if (this.widget && this.onResetCacheNeededCallback) {
        this.onResetCacheNeededCallback()
        this.widget.activeChart().resetData()
        //this.$socket.emit('subscribe', { room: 'ticker', params: { chain: this.network.name, market: to, resolution: this.resolution } })
      }
    }
  },

  mounted() {
    this.mountChart()
  },

  methods: {
    mountChart() {
      const Widget = require('~/assets/charts/charting_library.min.js').widget

      const widgetOptions = {
        symbol: this.quote_token.symbol.name,
        datafeed: {
          onReady: (callback) => {
            const data = { supported_resolutions: ['1', '15', '30', '60', '240', 'D', 'W', 'M'], symbols_types: [{ name: 'crypto', value: 1 }] }
            callback(data)
          },

          subscribeBars: (symbolInfo, resolution, onRealtimeCallback, subscriberUID, onResetCacheNeededCallback) => {
            this.onResetCacheNeededCallback = onResetCacheNeededCallback

            this.$socket.emit('subscribe', { room: 'ticker', params: { chain: this.network.name, market: this.id, resolution: this.resolution } })

            this.$socket.on('tick', candle => {
              onRealtimeCallback({
                time: candle[0] * 1000,
                open: candle[1],
                high: candle[2],
                low: candle[3],
                close: candle[4],
                volume: candle[5]
              })
            })
          },

          resolveSymbol: (symbolName, onSymbolResolvedCallback, onResolveErrorCallback) => {
            const symbolInfo = {
              name: this.quote_token.symbol.name,
              description: `${this.quote_token.symbol.name}/${this.quote_token.symbol.name}`,
              //type: symbolItem.type,
              session: '24x7',
              timezone: 'Etc/UTC',
              //exchange: symbolItem.exchange,
              minmov: 1,
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
            this.resolution = resolution

            const { data: charts } = await this.$axios.get(`/markets/${this.id}/charts`, {
              params: { resolution, from, to }
            })

            const bars = charts.map((i) => {
              return {
                time: i[0] * 1000,
                open: i[1],
                high: i[2],
                low: i[3],
                close: i[4],
                volume: i[5]
              }
            })
            onHistoryCallback(bars, { noData: bars.length == 0 })
          },

          unsubscribeBars: (subscriberUID) => {
          }
        },
        //datafeed: new window.Datafeeds.UDFCompatibleDatafeed(this.datafeedUrl), for test
        interval: '240',
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

          'legend_widget',
          'edit_buttons_in_legend',
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
        theme: this.$colorMode.value,
        custom_css_url: '/tv_themed.css',
        overrides: {
          'paneProperties.background': this.$colorMode.value == 'light' ? '#F3FAFC' : '#282828',
          'scalesProperties.textColor': this.$colorMode.value == 'light' ? '#4a4a4a' : '#9EABA3'
        }
      }

      this.widget = new Widget(widgetOptions)
    }
  }
}
</script>

<style>
#tv_chart_container {
  height: 460px;
}
</style>
