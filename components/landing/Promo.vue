<template lang="pug">
.promo
  .chart
    asd
    alcor-chart(
      :series="series"
      :options="options"
    )
  .preview
    zxc
</template>

<script>
import AlcorChart from '@/components/AlcorChart'

export default {
  components: { AlcorChart },
  props: ['promo'],
  data: () => ({
    series: [{ name: 'Price' }],
    interval: null,
    options: {
      title: {
        text: '1H Daily Chart',
        align: 'left',
        margin: 0,
        offsetY: 20,
        style: {
          color: '#fff',
          fontSize: '10px',
          fontWeight: 400,
          fontFamily: 'Roboto, Arial, sans-serif'
        }
      },
      grid: {
        borderColor: '#333333',
        xaxis: { lines: { show: true } },
        yaxis: { lines: { show: true } }
      },
      xaxis: {
        lines: { show: false },
        type: 'datetime',
        tooltip: { enabled: false },
        axisBorder: { color: '#333333' },
        axisTicks: {
          color: '#333333',
          height: 10
        },
        labels: {
          datetimeUTC: false,
          style: {
            colors: '#fff',
            fontSize: '10px',
            fontFamily: 'Roboto, Arial, sans-serif'
          }
        }
      },
      yaxis: {
        lines: { show: false },
        opposite: true,
        axisTicks: {
          show: true,
          color: '#333333',
          width: 4
        },
        labels: {
          style: {
            colors: ['#fff'],
            fontSize: '10px',
            fontFamily: 'Roboto, Arial, sans-serif'
          }
        }
      }
    }
  }),
  mounted() {
    this.fetchCharts()
    this.interval = setInterval(this.fetchCharts, 1000)
  },
  destroyed() {
    clearInterval(this.interval)
  },
  methods: {
    async fetchCharts() {
      if (this.promo) {
        const charts = (await this.$axios.get(`/pools/${this.promo}/charts`, { params: { period: '7D' } })).data
        const newData = charts.map(point =>
          ({ x: point.time, y: +point.price.toFixed(6) })
        )
        this.series = [{ ...this.series, data: newData }]
      }
    }
  }
}
</script>

<style>
.promo {
  height: 100%;
  display: flex;
  gap: 16px;
}

.promo .chart {
  width: 400px;
  border: 1px solid #333;
  border-radius: 4px;
  padding: 16px 12px;
}
</style>
