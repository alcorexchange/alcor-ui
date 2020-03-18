<template lang="pug">
  div(v-loading="loading")
    div(ref="chart")
</template>

<script>
import { mapGetters } from 'vuex'
import { dayChart } from '~/utils/charts'

export default {
  data() {
    return {
      chart: null,
      candleSeries: null,
      charts_list: [],
      loading: true
    }
  },

  computed: {
    ...mapGetters('market', ['token', 'charts'])
  },

  watch: {
    charts() {
      if (this.charts_list.length == this.charts.length) return

      this.makeCharts()
    }
  },

  mounted() {
    const LightweightCharts = require('lightweight-charts')

    const elem = this.$refs.chart
    this.chart = LightweightCharts.createChart(elem, {
      width: elem.offsetWidth,
      height: 200,
      //layout: {
      //  backgroundColor: '#000000',
      //  textColor: 'rgba(255, 255, 255, 0.9)',
      //},
      //grid: {
      //  vertLines: {
      //    color: 'rgba(197, 203, 206, 0.5)',
      //  },
      //  horzLines: {
      //    color: 'rgba(197, 203, 206, 0.5)',
      //  },
      //},
      crosshair: {
        mode: LightweightCharts.CrosshairMode.Normal,
      },
      priceScale: {
        borderColor: 'rgba(197, 203, 206, 0.8)'
      },
      timeScale: {
        borderColor: 'rgba(197, 203, 206, 0.8)'
      },
    })

    this.candleSeries = this.chart.addCandlestickSeries({
      //upColor: 'rgba(255, 144, 0, 1)',
      //downColor: '#000',
      //borderDownColor: 'rgba(255, 144, 0, 1)',
      //borderUpColor: 'rgba(255, 144, 0, 1)',
      //wickDownColor: 'rgba(255, 144, 0, 1)',
      //wickUpColor: 'rgba(255, 144, 0, 1)',
    })

    // TODO Add volume
    //const volumeSeries = chart.addHistogramSeries({
    //  color: '#26a69a',
    //  lineWidth: 2,
    //  priceFormat: {
    //    type: 'volume'
    //  },
    //  overlay: true,
    //  scaleMargins: {
    //    top: 0.8,
    //    bottom: 0
    //  }
    //})

    this.candleSeries.applyOptions({
      priceFormat: {
        //type: 'volume',
        precision: 8,
        minMove: 0.0000001
      }
    })

    this.makeCharts()
  },

  methods: {
    makeCharts() {
      try {
        this.charts_list = this.charts // Stor react this
        const p = p => parseFloat(this.$options.filters.humanFloat(p))
        this.candleSeries.setData(dayChart(this.charts_list).map(i => {
          return {
            time: i.time,
            open: p(i.open),
            high: p(i.high),
            low: p(i.low),
            close: p(i.close)
          }
        }))
        this.loading = false
      } catch (e) {
        this.$notify({ title: 'Graph', message: 'graph fetch error', type: 'warning' })
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
</style>
