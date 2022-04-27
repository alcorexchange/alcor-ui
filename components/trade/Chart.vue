<template lang="pug">
#tv_chart_container
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

          this.gridExecutions.push(execution)
        }
      }
    },

    mountChart() {
      console.log('mountChart called...')
      const { $TVChart: { Widget } } = this

      const widgetOptions = {
        symbol: this.quote_token.symbol.name,

        datafeed: {
          onReady: (cb) => {
            console.log('onReady called...')
            setTimeout(() => {
              cb({
                //exchanges: [{ value: 'asdfasdf', name: 'aaaa', desc: 'df' }],
                symbols_types: [{ value: 'asdfasdf', name: 'aaaa' }],
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
          //getBars: (symbolInfo, resolution, { from, to, countBack, firstDataRequest }, onHistoryCallback, onErrorCallback) => {

          getBars: (symbolInfo, resolution, from, to, onHistoryCallback, onErrorCallback, firstDataRequest) => {
            console.log('get bars called...', from, to, firstDataRequest)
            this.resolution = resolution

            this.$axios.get(`/markets/${this.id}/charts`, { params: { resolution, from, to } })
              .then(({ data: charts }) => {
                onHistoryCallback(charts.reverse(), { noData: charts.length == 0 })

                if (firstDataRequest) {
                  this.widget.activeChart().resetData()
                  this.widget.activeChart().setSymbol(this.quote_token.symbol.name)

                  this.isReady = true
                  setTimeout(() => this.drawOrders(), 1000)
                }
              }).catch(e => onErrorCallback('Charts loading error..', e))

            // FIXME Called 2 times, why? (Downgraded to old version as fix)
            //console.log('get bars called...', from, to, firstDataRequest)
            //this.resolution = resolution

            //if (firstDataRequest) {
            //  // Using countBack
            //  this.$axios.get(`/markets/${this.id}/charts`, { params: { resolution, limit: countBack + 1 } })
            //    .then(({ data: charts }) => {
            //      onHistoryCallback(charts.reverse(), { noData: charts.length == 0 })

            //      // Rerender chart Because market changed
            //      this.widget.activeChart().resetData()
            //      this.widget.activeChart().setSymbol(this.quote_token.symbol.name)

            //      this.isReady = true
            //      setTimeout(() => this.drawOrders(), 1000)
            //    }).catch(e => onErrorCallback('Charts loading error..', e))
            //} else {
            //  this.$axios.get(`/markets/${this.id}/charts`, { params: { resolution, from, to } })
            //    .then(({ data: charts }) => {
            //      onHistoryCallback(charts.reverse(), { noData: charts.length == 0 })
            //    }).catch(e => onErrorCallback('Charts loading error..', e))
            //}
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
        container_id: 'tv_chart_container',
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
          'control_bar',

          //'symbol_search_hot_key',
          this.isMobile ? 'left_toolbar' : undefined,

          'cropped_tick_marks',
          'main_series_scale_menu',
          'trading_notifications',
          'show_trading_notifications_history',
          //'end_of_period_timescale_marks',
          'datasource_copypaste',
          'chart_crosshair_menu',

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
          //'volume_force_overlay',
          //'property_pages',
        ],
        enabled_features: [
          'side_toolbar_in_fullscreen_mode',
          'header_in_fullscreen_mode',
        ],

        //fullscreen: false,
        autosize: true,
        studies_overrides: () => ({}),

        // Styles
        theme: this.$colorMode.value,
        custom_css_url: '/tv_themed.css',

        overrides: {
          'paneProperties.background': this.$colorMode.value == 'light' ? '#F3FAFC' : '#212121',
          'scalesProperties.textColor': this.$colorMode.value == 'light' ? '#4a4a4a' : '#9EABA3',

          'paneProperties.vertGridProperties.color': this.$colorMode.value == 'light' ? '#F3FAFC' : '#212121',
          'paneProperties.horzGridProperties.color': this.$colorMode.value == 'light' ? '#F3FAFC' : '#303130e4'
        },

        loading_screen: {
          backgroundColor: this.$colorMode.value == 'light' ? '#F3FAFC' : '#212121',
          foregroundColor: this.$colorMode.value == 'light' ? '#4a4a4a' : '#9EABA3'
        }
      }

      this.widget = new Widget(widgetOptions)
      this.widget.onChartReady(() => {
        this.load()

        this.widget.subscribe('onAutoSaveNeeded', () => {
          this.save()
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
