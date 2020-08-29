<template lang="pug">
  #tv_chart_container
</template>

<script>
import { mapState } from 'vuex'

export default {
  props: {
    symbol: {
      default: 'AAPL',
      type: String
    },
    interval: {
      default: 'D',
      type: String
    },
    containerId: {
      default: 'tv_chart_container',
      type: String
    },
    datafeedUrl: {
      default: 'https://demo_feed.tradingview.com',
      type: String
    },
    libraryPath: {
      default: '/charting_library/',
      type: String
    },
    chartsStorageUrl: {
      default: 'https://saveload.tradingview.com',
      type: String
    },
    chartsStorageApiVersion: {
      default: '1.1',
      type: String
    },
    clientId: {
      default: 'tradingview.com',
      type: String
    },
    userId: {
      default: 'public_user_id',
      type: String
    },
    fullscreen: {
      default: false,
      type: Boolean
    },
    autosize: {
      default: true,
      type: Boolean
    },
    studiesOverrides: {
      type: Object
    }
  },
  tvWidget: null,

  data() {
    return {
      chart: null,
      candleSeries: null,
    }
  },

  computed: {
    ...mapState('market', ['token', 'id'])
  },

  mounted() {
    const Widget = require('~/assets/charts/charting_library.min.js').widget

    const widgetOptions = {
      symbol: this.token.symbol.name,
      // BEWARE: no trailing slash is expected in feed URL
      datafeed: {
        onReady: (callback) => {
          console.log('[onReady]: Method call')
          const data = { supported_resolutions: ['1', '15', '30', '60', '240', 'D', 'W', 'M'], symbols_types: [{ name: 'crypto', value: 1 }] }
          callback(data)
        },

        searchSymbols: (userInput, exchange, symbolType, onResultReadyCallback) => {
          console.log('[searchSymbols]: Method call')
        },

        resolveSymbol: (symbolName, onSymbolResolvedCallback, onResolveErrorCallback) => {
          console.log('[resolveSymbol]: Method call', symbolName)
          const symbolInfo = {
            name: this.token.symbol.name,
            description: `${this.$store.state.network.baseToken.symbol}/${this.token.symbol.name}`,
            //type: symbolItem.type,
            session: '24x7',
            timezone: 'Etc/UTC',
            //exchange: symbolItem.exchange,
            //minmov: 0.0000001,
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
          console.log('[getBars]: Method call', symbolInfo, ' resolution:', resolution, 'from: ', from, 'to: ', to)

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
        subscribeBars: (symbolInfo, resolution, onRealtimeCallback, subscribeUID, onResetCacheNeededCallback) => {
          console.log('[subscribeBars]: Method call with subscribeUID:', subscribeUID)
        },
        unsubscribeBars: (subscriberUID) => {
          console.log('[unsubscribeBars]: Method call with subscriberUID:', subscriberUID)
        }
      },
      //datafeed: new window.Datafeeds.UDFCompatibleDatafeed(this.datafeedUrl),
      interval: this.interval,
      container_id: this.containerId,
      library_path: this.libraryPath,
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
        'legend_widget', // TODO Activate later
        'edit_buttons_in_legend',
        'context_menus',
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

        //'use_localstorage_for_settings',
      ],
      //enabled_features: ['items_favoriting'],
      //charts_storage_url: this.chartsStorageUrl,
      //charts_storage_api_version: this.chartsStorageApiVersion,
      //client_id: this.clientId,
      //user_id: this.userId,
      fullscreen: this.fullscreen,
      autosize: this.autosize,
      studies_overrides: this.studiesOverrides,

      // Styles
      theme: 'light', // TODO Dark theme
      custom_css_url: '/tv_themed.css',
      overrides: {
        'paneProperties.background': '#F3FAFC',
      }
    }

    const tvWidget = new Widget(widgetOptions)
    this.tvWidget = tvWidget
  }
}
</script>

<style>
.blist a {
  all: unset;
}

#tv_chart_container {
  height: 500px;
}
</style>
