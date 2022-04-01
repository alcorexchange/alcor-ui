<template lang="pug">
  #preview_chart_container
</template>

<script>
// TODO Зафиксить график при переключении
import { mapState } from 'vuex'

export default {
  data() {
    return {
      resolution: 240,

      onRealtimeCallback: () => {},
      widget: null,
      onResetCacheNeededCallback: null,
      flag: false,
      executionshape_flg: false,
      executionshape: '',
      order: '',
    }
  },

  computed: {
    ...mapState('market', ['base_token', 'id', 'quote_token', 'chart_orders_settings']),
    ...mapState(['network'])
  },

  watch: {
    '$colorMode.value'() {
      this.mountChart()
    },

    id(to, from) {
      this.reset()
      this.load()
    },
    'chart_orders_settings.chart_order_interactivity'() {
      this.flag = false
      if (this.chart_orders_settings.show_open_orders && this.order.remove)
        this.order.remove()
      this.gridLabels()
    },
    'chart_orders_settings.show_labels'() {
      this.flag = false
      if (this.chart_orders_settings.show_open_orders && this.order.remove)
        this.order.remove()
      this.gridLabels()
    },
    'chart_orders_settings.show_open_orders'() {
      this.flag = false
      if (!this.chart_orders_settings.show_open_orders) {
        if (this.order.remove)
          this.order.remove()
      } else this.gridLabels()
    },
    'chart_orders_settings.show_trade_execution_amount'() {
      this.executionshape_flg = false
      if (this.chart_orders_settings.show_trade_executions && this.executionshape.remove)
        this.executionshape.remove()
      this.gridExecution()
    },
    'chart_orders_settings.show_trade_executions_price'() {
      this.executionshape_flg = false
      if (this.chart_orders_settings.show_trade_executions && this.executionshape.remove)
        this.executionshape.remove()
      this.gridExecution()
    },
    'chart_orders_settings.show_trade_executions'() {
      this.executionshape_flg = false
      if (!this.chart_orders_settings.show_trade_executions)
        this.executionshape.remove()
      else this.gridExecution()
    }
  },

  mounted() {
    this.mountChart()

    this.$socket.on('tick', (candle) => {
      this.onRealtimeCallback(candle)
    })

    this.$socket.io.on('reconnect', () => {
      this.reset()
    })
  },

  methods: {
    save() {
      const twChart = JSON.parse(JSON.stringify(this.$store.state.settings.twChart))
      this.widget.save((o) => {
        console.log('save chart for', this.id)
        twChart[this.id] = o
        this.$store.commit('settings/setTwChart', twChart)
      })
    },

    load() {
      // FIXME Not workin in production
      const twChart = this.$store.state.settings.twChart[this.id]
      console.log('load chart for', this.id)
      if (!twChart || !twChart.charts) return
      this.widget.load(twChart)
    },

    reset() {
      if (this.widget && this.onResetCacheNeededCallback) {
        this.onResetCacheNeededCallback()
      } else {
        this.mountChart()
      }
    },

    gridLabels() {
      if (this.chart_orders_settings.show_open_orders && !this.flag) {
        this.flag = true
        this.order = this.widget.chart().createOrderLine()
          .setLineLength(3)
          .setLineColor('#c95a5a')
          .setBodyBackgroundColor('#c95a5a')
          .setBodyBorderColor('#c95a5a')
          .setQuantityBackgroundColor('#c95a5a')
          .setBodyTextColor('#000')
          .setQuantityTextColor('#000')
          .setQuantityBorderColor('#c95a5a')
          .setCancelButtonBorderColor('#c95a5a')
          .setCancelButtonBackgroundColor('#FFF')
          .setCancelButtonIconColor('#000')
          .setLineStyle(1)
          .setQuantity("a")
          .setText("a")
        if (this.chart_orders_settings.show_labels) {
          this.order.setQuantity("150,000 VOID")
          this.order.setText("Buy")
          if (this.chart_orders_settings.chart_order_interactivity) {
            this.order
              .onMove(function() {
              })
              .onModify("onModify called", function(text) {
              })
              .onCancel("onCancel called", function(text) {
              })
          }
        } else {
          this.order.setQuantity("")
          this.order.setText("")
        }
        this.order.setPrice(0.008)
      }
    },

    gridExecution() {
      if (!this.executionshape_flg && this.chart_orders_settings.show_trade_executions) {
        this.executionshape_flg = true
        this.executionshape = this.widget.chart().createExecutionShape()
          .setText("0000 - 0000.7VOID")
          .setTextColor("#FFF")
          .setArrowColor("#00b9ff")
          .setFont("100pt")
          .setArrowHeight(8)
          .setDirection("buy")
          // .setTime(1648772490411)
          .setPrice(0.007)
        if (!this.chart_orders_settings.show_trade_executions_price)
          this.executionshape.setText("0000")
        if (!this.chart_orders_settings.show_trade_execution_amount)
          this.executionshape.setText("0000.7VOID")
        if (!this.chart_orders_settings.show_trade_executions_price && !this.chart_orders_settings.show_trade_execution_amount)
          this.executionshape.setText("")
      }
    },

    mountChart() {
      const Widget = require('~/assets/charts/charting_library.min.js').widget

      const widgetOptions = {
        symbol: this.quote_token.symbol.name,
        datafeed: {
          onReady: (callback) => {
            const data = {
              supported_resolutions: [
                '1',
                '15',
                '30',
                '60',
                '240',
                'D',
                'W',
                'M'
              ],
              symbols_types: [{ name: 'crypto', value: 1 }]
            }
            callback(data)
          },

          subscribeBars: (
            symbolInfo,
            resolution,
            onRealtimeCallback,
            subscriberUID,
            onResetCacheNeededCallback
          ) => {
            this.onResetCacheNeededCallback = onResetCacheNeededCallback

            this.$socket.emit('subscribe', { room: 'ticker', params: { chain: this.network.name, market: this.id, resolution: this.resolution } })

            this.onRealtimeCallback = onRealtimeCallback
            this.resolution = resolution
          },

          resolveSymbol: (
            symbolName,
            onSymbolResolvedCallback,
            onResolveErrorCallback
          ) => {
            const symbolInfo = {
              name: this.quote_token.symbol.name,
              //description: `${this.quote_token.symbol.name}/${this.base_token.symbol.name}`,
              //description: `${this.quote_token.symbol.name}/${this.base_token.symbol.name}`,
              //type: symbolItem.type,
              session: '24x7',
              //exchange: symbolItem.exchange,
              minmov: 1,
              pricescale: 100000000,
              has_intraday: true,
              has_no_volume: false,
              has_weekly_and_monthly: true,
              supported_resolutions: [
                '1',
                '15',
                '30',
                '60',
                '240',
                'D',
                'W',
                'M'
              ],
              volume_precision: 5,
              data_status: 'streaming'
            }

            onSymbolResolvedCallback(symbolInfo)
          },

          getBars: async (
            symbolInfo,
            resolution,
            from,
            to,
            onHistoryCallback,
            onErrorCallback,
            firstDataRequest
          ) => {
            this.resolution = resolution

            const { data: charts } = await this.$axios.get(
              `/markets/${this.id}/charts`,
              {
                params: { resolution, from, to }
              }
            )

            onHistoryCallback(charts, { noData: charts.length == 0 })
            this.widget.activeChart().resetData()
            this.widget.activeChart().setSymbol(this.quote_token.symbol.name)
          },

          unsubscribeBars: (subscriberUID) => {
            this.$socket.emit('unsubscribe', { room: 'ticker', params: { chain: this.network.name, market: this.id, resolution: this.resolution } })
          }
        },
        //datafeed: new window.Datafeeds.UDFCompatibleDatafeed(this.datafeedUrl), for test
        interval: '240',
        container_id: 'preview_chart_container',
        library_path: '/charting_library/',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
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
          'cropped_tick_marks',
          //'context_menus',

          //'edit_buttons_in_legend',
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
          //'property_pages',
          'timeframes_toolbar',
          'countdown'

          //'use_localstorage_for_settings',
        ],
        enabled_features: [
          'side_toolbar_in_fullscreen_mode',
          'header_in_fullscreen_mode',
          'save_chart_properties_to_local_storage'
        ],
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
          'paneProperties.background':
            this.$colorMode.value == 'light' ? '#F3FAFC' : '#282828',
          'scalesProperties.textColor':
            this.$colorMode.value == 'light' ? '#4a4a4a' : '#9EABA3'
        }
      }

      this.widget = new Widget(widgetOptions)
      this.widget.onChartReady(() => {
        this.load()
        this.widget.subscribe('onAutoSaveNeeded', () => {
          console.log('chart save..')
          this.save()
          this.gridLabels()
          this.gridExecution()
        })
      })
    }
  }
}
</script>

<style>
#preview_chart_container {
  width: 540px;
  height: 258px;
}
@media only screen and (max-width: 1000px) {
  #preview_chart_container {
    height: 360px;
  }
}
</style>
