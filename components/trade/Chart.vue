<template lang="pug">
.h-100
  slot
</template>

<script>
import { Big } from 'big.js'

import { mapState, mapGetters } from 'vuex'

export default {
  data() {
    return {
      resolution: 240,

      onRealtimeCallback: () => { },
      widget: null,
      onResetCacheNeededCallback: null,
      executionshape: '',
      order_lines: [],
      isReady: false,
      orderLines: [],
      gridExecutions: [],
      deals: [],
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
    '$store.state.settings.tradeColor'() {
      this.applyTheme()
    },

    userOrders() {
      this.drawOrders()
    },

    deals(to, from, x) {
      console.log(to.length, from.length)
      if (to.length > from.length) this.gridExecution()
    },

    id(to, from) {
      console.log('market changed!!')
      this.isReady = false
      this.reset()
      //this.load()
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
      this.widget.activeChart().removeAllShapes()
      this.gridExecution()
    },
    'chart_orders_settings.show_trade_executions_price'() {
      this.widget.activeChart().removeAllShapes()
      this.gridExecution()
    },
    'chart_orders_settings.show_trade_executions'(to) {
      if (to == false) {
        this.widget.activeChart().removeAllShapes()
      } else {
        this.reset()
      }
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
    lol() {
      console.log('lol called')
      this.widget.activeChart().removeAllShapes()
    },

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

    applyTheme() {
      const theme = this.chartThemes[this.$colorMode.value]
      const colors = this.chartColors[window.localStorage.getItem('trade-theme')]

      this.widget.onChartReady(() => {
        this.widget.applyOverrides({
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

          'scalesProperties.lineColor': theme.scaleLineColor
        })
      })
    },

    reset() {
      console.log('reset called..', this.onResetCacheNeededCallback)
      if (this.widget && this.onResetCacheNeededCallback) {
        this.cleanOrders()
        this.onResetCacheNeededCallback()
      } else {
        this.mountChart()
      }
    },

    cleanOrders() {
      // Clean all orders
      while (this.orderLines.length != 0) {
        const order = this.orderLines.pop()
        order.remove()
      }
    },

    drawOrders() {
      this.cleanOrders() // Just in case
      if (!this.isReady) return

      // TODO Get current from CSS by JS
      const green = '#66C167'
      const red = '#F96C6C'

      if (this.chart_orders_settings.show_open_orders) {
        this.orders.map(o => {
          const order = this.widget
            .activeChart()
            .createOrderLine() // FIXME Value is none how to fix? (seems was fixed)
            .setPrice(this.$options.filters.humanPrice(o.unit_price).replaceAll(',', ''))
            .setText(o.type == 'sell' ? 'Sell' : 'Buy')
            .setLineColor(o.type == 'buy' ? green : red)
            .setBodyBackgroundColor(o.type == 'buy' ? '#212121' : '#212121')
            .setBodyBorderColor(o.type == 'buy' ? green : red)
            .setQuantityBackgroundColor(o.type == 'buy' ? green : red)
            .setBodyTextColor('#f2fff2')
            .setQuantityTextColor('#161617')
            .setQuantityBorderColor(o.type == 'buy' ? green : red)
            .setCancelButtonBorderColor(o.type == 'buy' ? green : red)
            .setCancelButtonBackgroundColor('#212121')
            .setCancelButtonIconColor('#f2fff2')
          if (this.chart_orders_settings.show_labels) {
            order
              .setQuantity(o.type == 'buy' ? o.bid.quantity : o.ask.quantity) // TODO Cut the zeros
              .setLineLength(3)
          } else {
            order
              .setQuantity('')
          }

          if (this.chart_orders_settings.chart_order_interactivity) {
            order
              .onCancel(() => this.cancelOrder(order, o))
              .onMove(() => this.moveOrder(order, o))
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

    async loadHistory({ from, to }) {
      if (!this.user || !this.user.name) return
      console.log('loadHistory..')

      const { data: deals } = await this.$axios.get(
        `/account/${this.user.name}/deals`,
        {
          params: {
            from,
            to,
            market: this.id
          }
        }
      )

      deals.map((d) => {
        d.type = this.user.name == d.bidder ? 'buy' : 'sell'
      })

      this.deals = [].concat(this.deals, deals)
    },

    gridExecution() {
      if (!this.user || !this.widget || !this.chart_orders_settings.show_trade_executions) return

      console.log('Grid execution...')

      //this.gridExecutions.map(e => e.remove())
      //this.gridExecutions = []

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
          const options = {
            shape: deal.type == 'buy' ? 'arrow_up' : 'arrow_down',
            overrides: { color: deal.type == 'sell' ? '#f96c6c' : '#009688', fontsize: 12, fixedSize: false, wordWrapWidth: 200 },
            zOrder: 'top',
            disableSelection: false,
            disableSave: true
          }

          const text = (deal.type == 'buy' ? `${deal.bid}` : `${deal.ask}`) + ' WAX'
          if (this.chart_orders_settings.show_trade_execution_amount) {
            options.text = text
          }

          const execution = this.widget
            .activeChart()
            .createShape({ time: new Date(deal.time).getTime() / 1000, price: deal.unit_price }, options)

          //.createExecutionShape()
          //.setTooltip('@1,320.75 Limit Buy 1')
          //.setTooltip(`${deal.unit_price} ` + deal.type == 'buy' ? `@${deal.bid}` : `@${deal.ask}` + ' WAX')
          //.setTooltip(deal.buy)
          //.setText(deal.unit_price)
          //.setTextColor(deal.type == 'buy' ? '#66C167' : '#F96C6C')
          //.setArrowColor(deal.type == 'buy' ? '#66C167' : '#F96C6C')
          //.setDirection(deal.type)
          //.setTime(new Date(deal.time).getTime() / 1000)
          //.setPrice(deal.unit_price)
          //.setArrowHeight(10)
          //.setArrowSpacing(10)
          //.setFont('bold 15pt Verdana')

          this.gridExecutions.push(execution)
        }
      }
    },

    mountChart() {
      const { $TVChart: { Widget } } = this
      console.log('mountChart')

      const widgetOptions = {
        symbol: this.quote_token.symbol.name,

        datafeed: {
          onReady: (cb) => {
            console.log('onReady called...')
            setTimeout(() => {
              cb({
                //exchanges: [{ value: 'asdfasdf', name: 'aaaa', desc: 'df' }],
                //symbols_types: [{ value: 'asdfasdf', name: 'aaaa' }],
                supported_resolutions: ['1', '15', '30', '60', '240', 'D', 'W', 'M'],
                //currency_codes: [{ id: 'asdf', code: 'SDF', logoUrl: 'asdf', description: 'asdfasdf' }]
                // TODO https://github.com/tradingview/charting_library/wiki/JS-Api do more
                supports_time: false
              })
            }, 0)
          },

          searchSymbols: (userInput, exchange, symbolType, onResultReadyCallback) => {
            console.log('searchSymbols callback....')
          },

          //resolveSymbol(symbolName, onSymbolResolvedCallback, onResolveErrorCallback, extension) {
          //  console.log('resolveSymbol called...')
          //},

          resolveSymbol: (symbolName, onSymbolResolvedCallback, onResolveErrorCallback, extension) => {
            const symbolInfo = {
              name: this.quote_token.symbol.name,
              //description: 'ololol', TODO
              type: 'crypto',
              timezone: 'UTC',
              session: '24x7',
              minmov: 1,
              pricescale: 100000000,
              has_intraday: true,
              has_no_volume: false,
              has_weekly_and_monthly: true,
              supported_resolutions: ['1', '15', '30', '60', '240', 'D', 'W', 'M'],
              volume_precision: 5,
              data_status: 'streaming'
            }

            setTimeout(() => onSymbolResolvedCallback(symbolInfo), 0)
          },
          getBars: (symbolInfo, resolution, from, to, onHistoryCallback, onErrorCallback, firstDataRequest) => {
            this.resolution = resolution

            this.widget.activeChart().setSymbol(this.quote_token.symbol.name)
            this.$axios.get(`/markets/${this.id}/charts`, { params: { resolution, from, to } })
              .then(({ data: charts }) => {
                onHistoryCallback(charts.reverse(), { noData: charts.length == 0 })

                if (firstDataRequest) {
                  this.widget.activeChart().removeAllShapes()
                  this.widget.activeChart().resetData()
                  this.deals = []

                  this.isReady = true

                  setTimeout(() => this.drawOrders(), 1000)
                }

                if (this.user) this.loadHistory({ from, to })
              }).catch(e => onErrorCallback('Charts loading error..', e))
          },

          subscribeBars: (symbolInfo, resolution, onRealtimeCallback, subscriberUID, onResetCacheNeededCallback) => {
            console.log('subscribeBars called...')
            this.onResetCacheNeededCallback = onResetCacheNeededCallback

            this.$socket.emit('subscribe', {
              room: 'ticker',
              params: {
                chain: this.network.name,
                market: this.id,
                resolution: this.resolution
              }
            })

            this.onRealtimeCallback = onRealtimeCallback
            this.resolution = resolution
          },

          unsubscribeBars: (subscriberUID) => {
            console.log('unsubscribeBars called...')
            this.$socket.emit('unsubscribe', {
              room: 'ticker',
              params: {
                chain: this.network.name,
                market: this.id,
                resolution: this.resolution
              }
            })
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
        container_id: this.$slots.default[0].elm.id,
        library_path: '/charting_library/',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        favorites: {
          intervals: this.isMobile ? ['4'] : ['1', '15', '30', '60', '240', 'D', 'W', 'M'],
          //chartTypes: ["Area", "Line"]
        },
        locale: 'en', // TODO Change lang
        disabled_features: [
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

          'save_chart_properties_to_local_storage',
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
        studies_overrides: () => ({}),

        // Styles
        theme: this.$colorMode.value,
        custom_css_url: '/tv_themed.css',

        loading_screen: {
          backgroundColor: this.$colorMode.value == 'light' ? '#F3FAFC' : '#212121',
          foregroundColor: this.$colorMode.value == 'light' ? '#4a4a4a' : '#9EABA3'
        }
      }

      this.widget = new Widget(widgetOptions)
      this.widget.onChartReady(() => {
        this.load()
        this.applyTheme()

        this.widget.subscribe('onAutoSaveNeeded', () => {
          this.save()
        })
      })
    }
  }
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
