<template lang="pug">
#tv_chart_container
  el-table.w-100(:data='orders', max-height='260')
</template>

<script>
import { Big } from 'big.js'
import { asset, symbol } from 'eos-common'


import { mapState, mapGetters } from 'vuex'
import global from '~/plugins/global'


export default {
  data() {
    return {
      resolution: 240,

      onRealtimeCallback: () => {},
      widget: null,
      onResetCacheNeededCallback: null,
      executionshape_flg: false,
      executionshape: '',
      order_lines: [],
      isReady: false,
      orderLines: []
    }
  },

  computed: {
    ...mapState(['user', 'network']),
    ...mapGetters(['userOrders']),
    ...mapState('market', [
      'base_token',
      'id',
      'quote_token',
      'chart_orders_settings',
      'orderdata',
    ]),

    orders() {
      if (!this.user) return []

      return this.userOrders
        .filter((a) => a.account === this.user.name && a.market_id == this.id)
        .sort((a, b) => b.timestamp - a.timestamp)
    },
  },

  watch: {
    '$colorMode.value'() {
      this.mountChart()
    },

    userOrders() {
      this.drawOrders()
    },

    id(to, from) {
      this.reset()
      this.load()
      this.drawOrders()
    },

    'chart_orders_settings.chart_order_interactivity'() {
      if (!this.isReady) return
      this.flag = false
      if (this.chart_orders_settings.show_open_orders && this.order.remove)
        this.order.remove()
      this.drawOrders()
    },

    'chart_orders_settings.show_labels'() {
      if (!this.isReady) return
      this.flag = false
      if (this.chart_orders_settings.show_open_orders && this.order.remove)
        this.order.remove()
      this.drawOrders()
    },
    'chart_orders_settings.show_open_orders'() {
      if (!this.isReady) return
      this.flag = false
      if (!this.chart_orders_settings.show_open_orders) {
        if (this.order.remove) this.order.remove()
      } else this.drawOrders()
    },
    'chart_orders_settings.show_trade_execution_amount'() {
      if (!this.isReady) return
      this.executionshape_flg = false
      if (
        this.chart_orders_settings.show_trade_executions &&
        this.executionshape.remove
      )
        this.executionshape.remove()
      this.gridExecution()
    },
    'chart_orders_settings.show_trade_executions_price'() {
      if (!this.isReady) return
      this.executionshape_flg = false
      if (
        this.chart_orders_settings.show_trade_executions &&
        this.executionshape.remove
      )
        this.executionshape.remove()
      this.gridExecution()
    },
    'chart_orders_settings.show_trade_executions'() {
      if (!this.isReady) return
      this.executionshape_flg = false
      if (!this.chart_orders_settings.show_trade_executions)
        this.executionshape.remove()
      else this.gridExecution()
    },
  },

  mounted() {
    this.$nuxt.$on('loadUserOrdersFinish', () => {
      this.isReady = true
      this.drawOrders()
      console.log('on loadUserOrdersFinish!!')
    })

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
      const twChart = JSON.parse(
        JSON.stringify(this.$store.state.settings.twChart)
      )
      this.widget.save((o) => {
        twChart[this.id] = o
        this.$store.commit('settings/setTwChart', twChart)
      })
    },

    load() {
      // FIXME Not workin in production
      const twChart = this.$store.state.settings.twChart[this.id]
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

    drawOrders() {
      console.log('drawOrders..', this.isReady)

      if (!this.isReady) return

      if (this.chart_orders_settings.show_open_orders) {
        // Clean all orders
        while (this.orderLines.length != 0) {
          const order = this.orderLines.pop()
          order.remove()
        }

        this.orders.map(o => {
          console.log('lllllllll')
          const order = this.widget
            .chart()
            .createOrderLine()
            .setLineLength(3)
            .setLineColor(o.type == 'buy' ? '#1FC780' : '#E74747')
            .setBodyBackgroundColor(o.type == 'buy' ? '#1FC780' : '#E74747')
            .setBodyBorderColor(o.type == 'buy' ? '#1FC780' : '#E74747')
            .setQuantityBackgroundColor(o.type == 'buy' ? '#1FC780' : '#E74747')
            .setBodyTextColor('#000')
            .setQuantityTextColor('#000')
            .setQuantityBorderColor(o.type == 'buy' ? '#1FC780' : '#E74747')
            .setCancelButtonBorderColor(o.type == 'buy' ? '#1FC780' : '#E74747')
            .setCancelButtonBackgroundColor('#FFF')
            .setCancelButtonIconColor('#000')
            .setLineStyle(3)
          console.log('ooooooooo')

          if (this.chart_orders_settings.show_labels) {
            order
              .setQuantity(o.type == 'buy' ? o.bid.quantity : o.ask.quantity) // TODO Cut the zeros
              .setText(o.type == 'sell' ? 'Sell Line' : 'Buy Line')
              .setLineLength(3)

              .onCancel(() => this.cancelOrder(order, o))
              .onMove(() => this.moveOrder(order, o))

              .setPrice(this.$options.filters.humanPrice(o.unit_price).replaceAll(',', ''))
          }

          this.orderLines.push(order)
        })
      }
    },

    async moveOrder(order, orderdata) {
      const actions = [
        { // Cancel current order
          account: this.network.contract,
          name: ['buy', 'bid'].includes(orderdata.type) ? 'cancelbuy' : 'cancelsell',
          authorization: [this.user.authorization],
          data: { executor: this.user.name, market_id: this.id, order_id: orderdata.id }
        }
      ]

      const new_unit_price = Big(order.getPrice() * 100000000)

      console.log(orderdata)
      if (['buy', 'bid'].includes(orderdata.type)) {
        // buy order
        const bp = this.base_token.symbol.precision
        const qp = this.quote_token.symbol.precision
        const new_ask = Big(orderdata.bid.amount)
          .mul(-1).mul(Big(-100000000))
          .div(new_unit_price).abs()
          .div(Big(10).pow(bp))
          .round(qp, 0)

        console.log('new ask', new_ask.toString())

        actions.push({
          account: this.base_token.contract,
          name: 'transfer',
          authorization: [this.user.authorization],
          data: {
            from: this.user.name,
            to: this.network.contract,
            quantity: `${orderdata.bid.quantity}`,
            memo: `${new_ask} ${this.quote_token.str}`
          }
        })
      } else {
        const bp = this.base_token.symbol.precision
        const qp = this.quote_token.symbol.precision
        const new_ask = Big(orderdata.bid.amount)
          .mul(new_unit_price).div(Big(100000000))
          .div(Big(10).pow(qp))
          .round(bp, 0)

        console.log('new ask', new_ask.toString())

        actions.push({
          account: this.quote_token.contract,
          name: 'transfer',
          authorization: [this.user.authorization],
          data: {
            from: this.user.name,
            to: this.network.contract,
            quantity: `${orderdata.bid.quantity}`,
            memo: `${new_ask} ${this.base_token.str}`
          }
        })
      }


      //console.log('moved:=======', order.getPrice(), orderdata)
      //console.log(actions)


      await this.$store.dispatch('chain/sendTransaction', actions, { root: true })
      setTimeout(() => {
        this.$store.dispatch('updatePairBalances')
        this.$store.dispatch('loadOrders', this.id, { root: true })
      }, 1000)
    },

    async cancelOrder(position, order) {
      try {
        await this.$store.dispatch('chain/cancelorder', {
          account: this.user.name,
          market_id: this.id,
          type: order.type,
          order_id: order.id
        })

        //position.remove()

        this.$notify({
          title: 'Success',
          message: `Order canceled ${order.id}`,
          type: 'success'
        })
        setTimeout(() => {
          this.$store.dispatch('loadOrders', this.id)
          this.$store.dispatch('loadUserBalances')
        }, 3000)
      } catch (e) {
        this.$notify({ title: 'Place order', message: e, type: 'error' })
        console.log(e)
      } finally {
      }


      //this.orderdata.order = o
      //this.orderdata.show_cancel_modal = true TODO Modal for canceling
    },

    gridExecution() {
      if (
        !this.executionshape_flg &&
        this.chart_orders_settings.show_trade_executions
      ) {
        this.executionshape_flg = true
        this.executionshape = this.widget
          .chart()
          .createExecutionShape()
          .setText('0000 - 0000.7VOID')
          .setTextColor('#FFF')
          .setArrowColor('#00b9ff')
          .setFont('12pt Verdana')
          .setArrowHeight(8)
          .setDirection('buy')
          // .setTime(1648772490411)
          .setPrice(0.007)
        if (!this.chart_orders_settings.show_trade_executions_price)
          this.executionshape.setText('0000')
        if (!this.chart_orders_settings.show_trade_execution_amount)
          this.executionshape.setText('0000.7VOID')
        if (
          !this.chart_orders_settings.show_trade_executions_price &&
          !this.chart_orders_settings.show_trade_execution_amount
        )
          this.executionshape.setText('')
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
                'M',
              ],
              symbols_types: [{ name: 'crypto', value: 1 }],
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

            this.$socket.emit('subscribe', {
              room: 'ticker',
              params: {
                chain: this.network.name,
                market: this.id,
                resolution: this.resolution,
              },
            })

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
                'M',
              ],
              volume_precision: 5,
              data_status: 'streaming',
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
                params: { resolution, from, to },
              }
            )
            onHistoryCallback(charts, { noData: charts.length == 0 })
            this.widget.activeChart().resetData()
            this.widget.activeChart().setSymbol(this.quote_token.symbol.name)
          },

          unsubscribeBars: (subscriberUID) => {
            this.$socket.emit('unsubscribe', {
              room: 'ticker',
              params: {
                chain: this.network.name,
                market: this.id,
                resolution: this.resolution,
              },
            })
          },
        },
        //datafeed: new window.Datafeeds.UDFCompatibleDatafeed(this.datafeedUrl), for test
        interval: '240',
        container_id: 'tv_chart_container',
        library_path: '/charting_library/',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        favorites: {
          intervals: ['1', '15', '30', '60', '240', 'D', 'W', 'M'],
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
          'countdown',

          //'use_localstorage_for_settings',
        ],
        enabled_features: [
          'side_toolbar_in_fullscreen_mode',
          'header_in_fullscreen_mode',
          'save_chart_properties_to_local_storage',
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
            this.$colorMode.value == 'light' ? '#F3FAFC' : '#212121',
          'scalesProperties.textColor':
            this.$colorMode.value == 'light' ? '#4a4a4a' : '#9EABA3',
        },
      }

      this.widget = new Widget(widgetOptions)
      this.widget.onChartReady(() => {
        this.load()
        //this.isReady = true

        this.widget.subscribe('onAutoSaveNeeded', () => {
          this.save()
          //this.gridExecution()
        })
      })
    },
  },
}
</script>

<style>
#tv_chart_container {
  height: calc(100% - 56px) !important;
}
@media only screen and (max-width: 1000px) {
  #tv_chart_container {
    height: 360px;
  }
}
</style>
