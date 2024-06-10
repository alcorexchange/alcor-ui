<template lang="pug">
.h-100(v-if="pool")
  //| this.tickerSymbol {{ this.tickerSymbol }}
  slot
</template>

<script>
import { debounce } from 'lodash'
import { mapState } from 'vuex'
import { constructPoolInstance, parseToken } from '~/utils/amm'

export default {
  props: ['pool', 'isSorted'],

  data() {
    return {
      resolution: 240,

      onRealtimeCallback: () => { },
      widget: null,
      onResetCacheNeededCallback: null,
      executionshape: '',
      chartThemes: {
        light: {
          background: '#F0F2F5',
          textColor: '#303133',
          gridColor: 'rgba(50, 50, 50, .03)',
          scaleLineColor: '#CDD0D6'
        },
        dark: {
          background: '#212121',
          textColor: '#bdbdbd',
          gridColor: 'rgba(200, 200, 200, .03)',
          scaleLineColor: '#444444'
        }
      },
      chartColors: {
        default: {
          candleUpColor: '#26a69a',
          candleDownColor: '#f96c6c'
        },
        bloom: {
          candleUpColor: '#277DFA',
          candleDownColor: '#FFAB2E'
        },
        cyber: {
          candleUpColor: '#00AB4A',
          candleDownColor: '#F22B55'
        },
        contrast: {
          candleUpColor: '#00B909',
          candleDownColor: '#C60606'
        }
      }
    }
  },

  computed: {
    ...mapState(['user', 'network']),

    tickerSymbol() {
      const symbolA = this.pool?.tokenA?.symbol
      const symbolB = this.pool?.tokenB?.symbol

      return this.isSorted
        ? symbolB + '_' + symbolA
        : symbolA + '_' + symbolB
    },
  },

  watch: {
    // '$colorMode.value'() {
    //   this.mountChart()
    // },

    '$store.state.settings.tradeColor'() {
      //this.applyTheme()
    },

    isSorted() {
      this.reset()
    },

    pool(from, to) {
      if (from?.id == to?.id) return
      console.log('pool watch changed cahrt')

      this.resetDebounced()
    },

    // tokenA(from, to) {
    //   if (from?.id == to?.id) return

    //   this.resetDebounced()
    // },

    // tokenB(from, to) {
    //   if (from?.id == to?.id) return

    //   this.resetDebounced()
    // }
  },

  mounted() {
    this.mountChart()

    // this.$socket.on('tick', (candle) => {
    //   this.onRealtimeCallback(candle)
    // })

    // this.$socket.io.on('reconnect', () => {
    //   this.reset()
    // })
  },

  methods: {
    save() {
      const twChart = JSON.parse(
        JSON.stringify(this.$store.state.settings.twChart)
      )
      this.widget.save((o) => {
        twChart[this.id] = o
        this.$store.commit('settings/setSwapTwChart', twChart)
      })
    },

    load() {
      // FIXME Not workin in production
      const twChart = this.$store.state.settings.swapTwChart[this.id] // FIXME no id
      if (!twChart || !twChart.charts) return
      this.widget.load(twChart)
    },

    applyTheme() {
      const theme = this.chartThemes[this.$colorMode.value]
      const colors = this.chartColors[window.localStorage.getItem('trade-theme') || 'default']

      this.widget.onChartReady(() => {
        this.widget.applyOverrides({
          volumePaneSize: 'medium',
          'paneProperties.background': theme.background,
          'scalesProperties.textColor': theme.textColor,

          'paneProperties.vertGridProperties.color': theme.gridColor,
          'paneProperties.horzGridProperties.color': theme.gridColor,

          'paneProperties.legendProperties.showSeriesOHLC': false,

          'mainSeriesProperties.style': 1, // TODO play with

          'mainSeriesProperties.areaStyle.color1': 'rgba(88, 177, 75, .28)',
          'mainSeriesProperties.areaStyle.color2': 'rgba(88, 177, 75, 0)',
          'mainSeriesProperties.areaStyle.linecolor': 'rgba(88, 177, 75, 1)',

          'mainSeriesProperties.candleStyle.upColor': colors.candleUpColor,
          'mainSeriesProperties.candleStyle.downColor': colors.candleDownColor,
          'mainSeriesProperties.candleStyle.drawBorder': false,
          'mainSeriesProperties.candleStyle.wickUpColor': colors.candleUpColor,
          'mainSeriesProperties.candleStyle.wickDownColor': colors.candleDownColor,
          'mainSeriesProperties.hollowCandleStyle.upColor': colors.candleUpColor,
          'mainSeriesProperties.hollowCandleStyle.downColor': colors.candleDownColor,
          'mainSeriesProperties.hollowCandleStyle.wickUpColor': colors.candleUpColor,
          'mainSeriesProperties.hollowCandleStyle.wickDownColor': colors.candleDownColor,

          'scalesProperties.lineColor': theme.scaleLineColor
        })
      })
    },


    resetDebounced: debounce(function () {
      this.reset()
    }, 500),

    reset() {
      if (this.widget && this.onResetCacheNeededCallback) {
        this.onResetCacheNeededCallback()
        this.widget.activeChart().resetData()
      } else {
        this.mountChart()
      }
    },

    mountChart() {
      if (isNaN(this.pool?.id)) return

      const { $TVChart: { Widget } } = this

      const theme = this.chartThemes[this.$colorMode.value]
      const colors = this.chartColors[window.localStorage.getItem('trade-theme') || 'default']

      const widgetOptions = {
        symbol: this.tickerSymbol,

        datafeed: {
          onReady: (cb) => {
            setTimeout(() => {
              cb({
                // TODO might be put all pools here and aggregated
                //exchanges: [{ value: 'asdfasdf', name: 'aaaa', desc: 'df' }],
                //symbols_types: [{ value: 'asdfasdf', name: 'aaaa' }],
                supported_resolutions: ['1', '5', '15', '30', '60', '240', 'D', 'W', 'M'],
                //currency_codes: [{ id: 'asdf', code: 'SDF', logoUrl: 'asdf', description: 'asdfasdf' }]
                // TODO https://github.com/tradingview/charting_library/wiki/JS-Api do more
                supports_time: false
              })
            }, 0)
          },

          searchSymbols: (userInput, exchange, symbolType, onResultReadyCallback) => {
            console.log('searchSymbols callback....')
          },

          resolveSymbol: (symbolName, onSymbolResolvedCallback, onResolveErrorCallback, extension) => {
            console.log('resolveSymbol', this.tickerSymbol)
            const symbolInfo = {
              name: this.tickerSymbol,
              //description: 'ololol', TODO
              type: 'crypto',
              timezone: 'UTC',
              session: '24x7',
              minmov: 1,
              pricescale: 1000000000, // TODO Make dynamic
              has_intraday: true,
              has_no_volume: false,
              has_weekly_and_monthly: true,
              supported_resolutions: ['1', '5', '15', '30', '60', '240', 'D', 'W', 'M'],
              volume_precision: 5,
              data_status: 'streaming'
            }

            setTimeout(() => onSymbolResolvedCallback(symbolInfo), 0)
          },

          getBars: (symbolInfo, resolution, from, to, onHistoryCallback, onErrorCallback, firstDataRequest) => {
            this.resolution = resolution
            this.$axios.get(`/v2/swap/pools/${this.pool?.id}/candles`,
              { params: { resolution, from: from * 1000, to: to * 1000, reverse: this.isSorted } })
              .then(({ data: charts }) => {
                onHistoryCallback(charts, { noData: charts.length == 0 })

                if (firstDataRequest) {
                  this.widget.activeChart().setSymbol(this.tickerSymbol)
                  //this.widget.activeChart().resetData()
                }
              }).catch(e => onErrorCallback('Charts loading error..', e))
          },

          subscribeBars: (symbolInfo, resolution, onRealtimeCallback, subscriberUID, onResetCacheNeededCallback) => {
            console.log('subscribeBars called...')
            this.onResetCacheNeededCallback = onResetCacheNeededCallback

            // this.$socket.emit('subscribe', {
            //   room: 'ticker',
            //   params: {
            //     chain: this.network.name,
            //     market: this.id,
            //     resolution: this.resolution
            //   }
            // })

            this.onRealtimeCallback = onRealtimeCallback
            this.resolution = resolution
          },

          unsubscribeBars: (subscriberUID) => {
            // this.$socket.emit('unsubscribe', {
            //   room: 'ticker',
            //   params: {
            //     chain: this.network.name,
            //     market: this.id,
            //     resolution: this.resolution
            //   }
            // })
          },

          getMarks: (symbolInfo, from, to, onDataCallback, resolution) => {
            console.log('getMarks called...')
          },

          getTimescaleMarks: (symbolInfo, from, to, onDataCallback, resolution) => {
            console.log('getTimescaleMarks called...')
          },

          getServerTime: callback => {
            console.log('getServerTime called..')
          },

          getVolumeProfileResolutionForPeriod: (currentResolution, from, to, symbolInfo) => {
            console.log('getVolumeProfileResolutionForPeriod called...')
          }
        },
        interval: '240',
        container_id: this.$slots?.default[0]?.elm?.id || 'swap_tv_chart_container',
        library_path: '/charting_library/',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        favorites: {
          intervals: this.isMobile ? ['4'] : ['1', '5', '15', '30', '60', '240', 'D', 'W', 'M'],
          //chartTypes: ["Area", "Line"]
        },
        tooltip: {
          enabled: false // Отключает отображение тултипа
        },
        scales: {
          showValues: false // Отключает отображение значений O H L C на графике
        },
        locale: 'en', // TODO Change lang `this.$i18n.locale`
        disabled_features: [
          'show_ohlc',
          'status_line',
          'hide_last_value_on_legend',
          'show_prices_on_chart',
          'legend_context_menu',
          'main_series_scale_menu',
          'left_toolbar',
          //'header_widget',
          'symbol_search_hot_key',
          'header_symbol_search',
          //'header_chart_type',
          'header_settings',
          'header_compare',
          'header_undo_redo',
          //'header_screenshot',
          'compare_symbol',
          'border_around_the_chart',
          'header_saveload',
          //'control_bar',
          this.isMobile ? 'left_toolbar' : undefined,

          //'symbol_search_hot_key',

          'cropped_tick_marks',
          'trading_notifications',
          'show_trading_notifications_history',
          //'end_of_period_timescale_marks',
          'datasource_copypaste',
          'chart_crosshair_menu',
          'show_zoom_and_move_buttons_on_touch',

          //'shift_visible_range_on_new_bar',
          'go_to_date',
          'timezone_menu',
          'timeframes_toolbar',
          'countdown',

          'popup_hints',

          //'save_chart_properties_to_local_storage',
          //'use_localstorage_for_settings'

          //'header_resolutions',
          //'header_fullscreen_button',
          //'legend_widget',
          //'context_menus',
          //'edit_buttons_in_legend',
          'volume_force_overlay',
          'delete_button_in_legend'
          //'property_pages',
        ],
        enabled_features: [
          'side_toolbar_in_fullscreen_mode',
          this.isMobile ? 'hide_left_toolbar_by_default' : null,
          'header_in_fullscreen_mode'
        ],

        //fullscreen: false,
        autosize: true,
        auto_save_delay: 0,
        studies_overrides: () => ({}),

        // Styles
        theme: this.$colorMode.value,
        custom_css_url: '/tv_themed.css',

        overrides: {
          volumePaneSize: 'medium',
          'paneProperties.background': theme.background,
          'scalesProperties.textColor': theme.textColor,

          'paneProperties.vertGridProperties.color': theme.gridColor,
          'paneProperties.horzGridProperties.color': theme.gridColor,

          'mainSeriesProperties.candleStyle.upColor': colors.candleUpColor,
          'mainSeriesProperties.candleStyle.downColor': colors.candleDownColor,
          'mainSeriesProperties.candleStyle.drawBorder': false,
          'mainSeriesProperties.candleStyle.wickUpColor': colors.candleUpColor,
          'mainSeriesProperties.candleStyle.wickDownColor': colors.candleDownColor,
          'mainSeriesProperties.hollowCandleStyle.upColor': colors.candleUpColor,
          'mainSeriesProperties.hollowCandleStyle.downColor': colors.candleDownColor,
          'mainSeriesProperties.hollowCandleStyle.wickUpColor': colors.candleUpColor,
          'mainSeriesProperties.hollowCandleStyle.wickDownColor': colors.candleDownColor,

          'scalesProperties.lineColor': theme.scaleLineColor,
        },

        loading_screen: {
          backgroundColor: this.$colorMode.value == 'light' ? '#F3FAFC' : '#212121',
          foregroundColor: this.$colorMode.value == 'light' ? '#4a4a4a' : '#9EABA3'
        }
      }

      this.widget = new Widget(widgetOptions)
      this.widget.onChartReady(() => {
        //this.load()

        this.applyTheme()

        this.widget.subscribe('onAutoSaveNeeded', () => {
          //this.save()
        })

        // Save on indicators update
        this.widget.subscribe('study_event', (e) => {
          console.log('event', e)
          //this.save()
        })
      })
    }
  }
}
</script>

<style>
</style>
