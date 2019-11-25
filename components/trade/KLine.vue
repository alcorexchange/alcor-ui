<template lang="pug">
div(ref="chart")
  //trading-vue(:data='chart' :width='width' :height='height'
      :color-back='colors.colorBack'
      color-grid='colors.colorGrid'
      :color-text='colors.colorText')

</template>

<script>
import { mapGetters } from 'vuex'
import { backEnd } from '~/api'

export default {
  data() {
    return {
      history: [],
      //width: '100%',
      width: 600,
      height: 300,
      colors: {
        colorBack: '#fff',
        colorGrid: '#eee',
        colorText: '#333'
      }
    }
  },

  computed: {
    ...mapGetters('market', ['token']),

    chart () {
      return {
        ohlcv: this.history.map(h => {
          return [
            h[0],
            parseFloat(this.$options.filters.humanFloat(h[1])),
            parseFloat(this.$options.filters.humanFloat(h[2])),
            parseFloat(this.$options.filters.humanFloat(h[3])),
            parseFloat(this.$options.filters.humanFloat(h[4])),
            h[5]
          ]
        })
      }
    },
  },

  mounted() {
    const LightweightCharts = require('lightweight-charts')

    const elem = this.$refs.chart
    const chart = LightweightCharts.createChart(elem, {
      width: elem.offsetWidth,
      height: 400,
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

    const candleSeries = chart.addCandlestickSeries({
      //upColor: 'rgba(255, 144, 0, 1)',
      //downColor: '#000',
      //borderDownColor: 'rgba(255, 144, 0, 1)',
      //borderUpColor: 'rgba(255, 144, 0, 1)',
      //wickDownColor: 'rgba(255, 144, 0, 1)',
      //wickUpColor: 'rgba(255, 144, 0, 1)',
    })

    const volumeSeries = chart.addHistogramSeries({
      color: '#26a69a',
      lineWidth: 2,
      priceFormat: {
        type: 'volume'
      },
      overlay: true,
      scaleMargins: {
        top: 0.8,
        bottom: 0
      }
    })

    candleSeries.applyOptions({
      priceFormat: {
        //type: 'volume',
        precision: 8,
        minMove: 0.0000001,
      }
    })

    const p = p => parseFloat(this.$options.filters.humanFloat(p))

    backEnd.get(`charts?quote=${this.token.symbol.name}&base=EOS`).then(r => {
      //candleSeries.setData(r.data.slice(1).map(d => {
      candleSeries.setData(r.data.map(d => {
        return {
          time: d.time,
          open: p(d.open),
          high: p(d.high),
          low: p(d.low),
          close: p(d.close)
        }
      }))

      //{ time: '2018-10-24', value: 37435638.00, color: 'rgba(0, 150, 136, 0.8)' },
      //{ time: '2018-10-25', value: 25269995.00, color: 'rgba(255,82,82, 0.8)' },
      //volumeSeries.setData(r.data.map(d => {
      //  return {
      //    time: d.time,
      //    value: d.volume,
      //    color: 'rgba(0, 150, 136, 0.8)'
      //  }
      //}))
    }).catch(e => {
      console.log('graph fetch error:', e)
    })
  }
}
</script>

<style>
.blist a {
  all: unset;
}
</style>
