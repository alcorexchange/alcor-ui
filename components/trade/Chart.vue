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
      charts_list: [],
    }
  },

  computed: {
    ...mapState('market', ['token', 'charts'])
  },

  watch: {
    charts() {
      if (this.charts_list.length == this.charts.length) return

      this.makeCharts()
    }
  },

  mounted() {
    const Widget = require('~/assets/charts/charting_library.min.js').widget

    const widgetOptions = {
      symbol: this.symbol,
      // BEWARE: no trailing slash is expected in feed URL
      datafeed: new window.Datafeeds.UDFCompatibleDatafeed(this.datafeedUrl),
      interval: this.interval,
      container_id: this.containerId,
      library_path: this.libraryPath,

      locale: 'en', // TODO Change lang
      disabled_features: [
        'header_symbol_search',
        'header_chart_type',
        'header_settings',
        'header_compare',
        'header_undo_redo',
        'header_screenshot',
        'header_fullscreen_button',
        'compare_symbol',
        'border_around_the_chart',
        'header_saveload',
        'control_bar',

        'symbol_search_hot_key',
        'left_toolbar',
        'legend_widget',
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
        'timeframes_toolbar'
      ],
      enabled_features: [],
      charts_storage_url: this.chartsStorageUrl,
      charts_storage_api_version: this.chartsStorageApiVersion,
      client_id: this.clientId,
      user_id: this.userId,
      fullscreen: this.fullscreen,
      autosize: this.autosize,
      studies_overrides: this.studiesOverrides
    }

    const tvWidget = new Widget(widgetOptions)
    this.tvWidget = tvWidget

    tvWidget.onChartReady(() => {
      tvWidget.headerReady().then(() => {
        const button = tvWidget.createButton()

        button.setAttribute('title', 'Click to show a notification popup')
        button.classList.add('apply-common-tooltip')

        button.addEventListener('click', () =>
          tvWidget.showNoticeDialog({
            title: 'Notification',
            body: 'TradingView Charting Library API works correctly',
            callback: () => {
              // eslint-disable-next-line no-console
              console.log('Noticed!')
            }
          })
        )

        button.innerHTML = 'Check API'
      })
    })

    //const elem = this.$refs.chart
    //this.chart = LightweightCharts.createChart(elem, {
    //  width: elem.offsetWidth,
    //  height: 200,
    //  //layout: {
    //  //  backgroundColor: '#000000',
    //  //  textColor: 'rgba(255, 255, 255, 0.9)',
    //  //},
    //  //grid: {
    //  //  vertLines: {
    //  //    color: 'rgba(197, 203, 206, 0.5)',
    //  //  },
    //  //  horzLines: {
    //  //    color: 'rgba(197, 203, 206, 0.5)',
    //  //  },
    //  //},
    //  crosshair: {
    //    mode: LightweightCharts.CrosshairMode.Normal,
    //  },
    //  priceScale: {
    //    borderColor: 'rgba(197, 203, 206, 0.8)'
    //  },
    //  timeScale: {
    //    borderColor: 'rgba(197, 203, 206, 0.8)'
    //  },
    //})

    //this.candleSeries = this.chart.addCandlestickSeries({
    //  //upColor: 'rgba(255, 144, 0, 1)',
    //  //downColor: '#000',
    //  //borderDownColor: 'rgba(255, 144, 0, 1)',
    //  //borderUpColor: 'rgba(255, 144, 0, 1)',
    //  //wickDownColor: 'rgba(255, 144, 0, 1)',
    //  //wickUpColor: 'rgba(255, 144, 0, 1)',
    //})

    //// TODO Add volume
    ////const volumeSeries = chart.addHistogramSeries({
    ////  color: '#26a69a',
    ////  lineWidth: 2,
    ////  priceFormat: {
    ////    type: 'volume'
    ////  },
    ////  overlay: true,
    ////  scaleMargins: {
    ////    top: 0.8,
    ////    bottom: 0
    ////  }
    ////})

    //this.candleSeries.applyOptions({
    //  priceFormat: {
    //    //type: 'volume',
    //    precision: 8,
    //    minMove: 0.0000001
    //  }
    //})

    //this.makeCharts()
  },

  methods: {
    async makeCharts() {
      try {
        await this.$store.dispatch('market/fetchCharts')
        this.charts_list = this.charts // Stor react this
        const p = (p) =>
          parseFloat(this.$options.filters.humanPrice(p).replace(',', ''))
        this.candleSeries.setData(
          this.charts_list.map((i) => {
            return {
              time: i.time,
              open: p(i.open),
              high: p(i.high),
              low: p(i.low),
              close: p(i.close)
            }
          })
        )
      } catch (e) {
        // TODO Обработка оишбки
        this.$notify({
          title: 'Graph',
          message: 'graph fetch error',
          type: 'warning'
        })
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style>
.blist a {
  all: unset;
}

#tv_chart_container {
  height: 400px;
}
</style>
