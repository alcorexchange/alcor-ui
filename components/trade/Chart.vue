<template lang="pug">
#tv_chart_container
  el-table.w-100(:data='orders', max-height='260')
</template>

<script>
import { Big } from 'big.js'

import { mapState, mapGetters } from 'vuex'

export default {
  data() {
    return {
      resolution: 240,

      onRealtimeCallback: () => {},
      widget: null,
      onResetCacheNeededCallback: null,
      executionshape: '',
      order_lines: [],
      isReady: false,
      orderLines: [],
      gridExecutions: [],
      skip: 0,
      deals: []
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
      this.isReady = false
      this.reset()
      this.load()
    },

    'chart_orders_settings.chart_order_interactivity'() {
      this.drawOrders()
    },

    'chart_orders_settings.show_labels'() {
      this.drawOrders()
    },
    'chart_orders_settings.show_open_orders'() {
      this.drawOrders()
    },
    'chart_orders_settings.show_trade_execution_amount'() {
      this.drawOrders()
    },
    'chart_orders_settings.show_trade_executions_price'() {
      this.gridExecution()
    },
    'chart_orders_settings.show_trade_executions'() {
      this.gridExecution()
    },
  },

  mounted() {
    //this.$nuxt.$on('loadUserOrdersFinish', () => {
    //  this.isReady = true
    //  this.drawOrders()
    //  console.log('on loadUserOrdersFinish!!')
    //})
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
      //console.log('drawOrders..', this.isReady)

      if (!this.isReady) return

      if (this.chart_orders_settings.show_open_orders) {
        // Clean all orders
        while (this.orderLines.length != 0) {
          const order = this.orderLines.pop()
          order.remove()
        }

        this.orders.map(o => {
          const order = this.widget
            .activeChart()
            .createOrderLine() // FIXME Value is none how to fix?
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
      // FIXME Не добавляет нулей для мемо при отправкe
      // TODO При перемещении менять динамически тотал текст, будет удобно
      const actions = [
        { // Cancel current order
          account: this.network.contract,
          name: ['buy', 'bid'].includes(orderdata.type) ? 'cancelbuy' : 'cancelsell',
          authorization: [this.user.authorization],
          data: { executor: this.user.name, market_id: this.id, order_id: orderdata.id }
        }
      ]

      const new_unit_price = Big(order.getPrice() * 100000000)

      if (['buy', 'bid'].includes(orderdata.type)) {
        // buy order
        const bp = this.base_token.symbol.precision
        const qp = this.quote_token.symbol.precision
        const new_ask = Big(orderdata.bid.amount)
          .mul(-1).mul(Big(-100000000))
          .div(new_unit_price).abs()
          .div(Big(10).pow(bp))
          .round(qp, 0)

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

      try {
        await this.$store.dispatch('chain/sendTransaction', actions, { root: true })
        setTimeout(() => {
          this.$store.dispatch('updatePairBalances')
          this.$store.dispatch('loadOrders', this.id, { root: true })
        }, 1000)
      } catch (e) {
        this.$notify({ title: 'Move order', message: e, type: 'error' })
        this.drawOrders()
      }
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
    },

    async loadHistory() {
      if (!this.user || !this.user.name) return

      const { data: deals } = await this.$axios.get(
        `/account/${this.user.name}/deals`,
        {
          params: {
            limit: 100,
            skip: this.skip,
            market: this.id
          }
        }
      )

      this.skip += deals.length

      if (deals.length) {
        deals.map((d) => {
          d.type = this.user.name == d.bidder ? 'buy' : 'sell'
        })

        //this.deals.push(...deals)
        this.deals = deals
        console.log('loaded')
      } else {
        console.log('complete')
      }
    },

    gridExecution() {
      console.log('Grid execution...')

      this.gridExecutions.map(e => e.remove())
      this.gridExecutions = []

      if (this.chart_orders_settings.show_trade_executions) {
        const _deals = []

        const compressed = {}
        for (const deal of this.deals) {
          if (compressed[deal.trx_id]) {
            compressed[deal.trx_id].push(deal)
          } else {
            compressed[deal.trx_id] = [deal]
          }
        }

        for (const pack of Object.values(compressed)) {
          const byPrice = {}

          for (const d of pack) {
            if (byPrice[d.unit_price]) {
              byPrice[d.unit_price].bid += d.bid
              byPrice[d.unit_price].ask += d.ask
            } else {
              byPrice[d.unit_price] = d
            }
          }

          _deals.push(...Object.values(byPrice))
        }


        for (const deal of _deals) {
          const execution = this.widget
            .activeChart()
            .createExecutionShape()
            //.setTooltip('@1,320.75 Limit Buy 1')
            //.setTooltip(`${deal.unit_price} ` + deal.type == 'buy' ? `@${deal.bid}` : `@${deal.ask}`)
            .setTooltip(deal.buy)

            .setText(deal.unit_price)
            .setTextColor(deal.type == 'buy' ? '#66C167' : '#F96C6C')
            .setArrowColor(deal.type == 'buy' ? '#66C167' : '#F96C6C')
            .setDirection(deal.type)
            .setTime(new Date(deal.time).getTime() / 1000)
            .setPrice(deal.unit_price)
            .setArrowHeight(10)
            .setArrowSpacing(0)
            .setFont('bold 15pt Verdana')

          //if (!this.chart_orders_settings.show_trade_executions_price)
          //  this.executionshape.setText('0000')
          //if (!this.chart_orders_settings.show_trade_execution_amount)
          //  this.executionshape.setText('0000.7VOID')
          //if (
          //  !this.chart_orders_settings.show_trade_executions_price &&
          //  !this.chart_orders_settings.show_trade_execution_amount
          //)
          //  this.executionshape.setText('')

          //gridExecutions.push


          this.gridExecutions.push(execution)
        }
        //for
        //this.executionshape = this.widget
        //  .chart()
        //  .createExecutionShape()
        //  .setTooltip('@1,320.75 Limit Buy 1')
        //  .setText('0000 - 0000.7VOID')
        //  .setTextColor('#f96c6c')
        //  .setArrowColor('#f96c6c')
        //  //.setFont('18pt Verdana')
        //  //.setArrowSpacing(25)
        //  //.setArrowHeight(25)
        //  .setDirection('buy')
        //  .setLineStyle(2)
        //  // .setTime(1648772490411)
        //  .setPrice(0.007)
        //  .setArrowHeight(20)
        //  .setArrowSpacing(0)
        //  .setFont('bold 15pt Verdana')

        //if (!this.chart_orders_settings.show_trade_executions_price)
        //  this.executionshape.setText('0000')
        //if (!this.chart_orders_settings.show_trade_execution_amount)
        //  this.executionshape.setText('0000.7VOID')
        //if (
        //  !this.chart_orders_settings.show_trade_executions_price &&
        //  !this.chart_orders_settings.show_trade_execution_amount
        //)
        //  this.executionshape.setText('')
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

            this.isReady = true

            this.drawOrders()
            //this.loadHistory().then(() => this.gridExecution()) TODO History on chart
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
          this.isMobile ? 'left_toolbar' : undefined,

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
  height: calc(100%) !important;
}
@media only screen and (max-width: 1000px) {
  #tv_chart_container {
    height: 360px;
  }
}
</style>
