<template lang="pug">
.depth-chart(
  :is-draggable='false',
  :is-resizable='false',
  :is-mirrored='false',
  :vertical-compact='false',
  :use-css-transforms='false',
  onmousedown='event.preventDefault ? event.preventDefault() : event.returnValue = false',
  ref='chartContainer'
)
  .chart-nav.scale-value-nav
    .chart-part
      highchart.wax-highchart(
        ref='chart',
        :options='chartOptions',
        :redraw='true',
        :update='["options", "options.title", "options.series"]',
        :is-draggable='false',
        :is-resizable='false',
        :is-mirrored='false',
        :vertical-compact='false',
        :use-css-transforms='false',
        v-loading='loading',
        v-on:click.stop
      )
</template>

<script>
import { mapGetters, mapState } from 'vuex'

export default {
  props: ['depthChartUpdated'],

  data() {
    return {
      chartOptions: {
        //credits: {
        //  enabled: false,
        //  align: 'right',
        //  verticalAlign: 'bottom'
        //},
        mapNavigation: {
          enabled: true,
          enableMouseWheelZoom: true
        },

        type: 'column',
        colors: [
          '#058DC7',
          '#50B432',
          '#ED561B',
          '#DDDF00',
          '#24CBE5',
          '#64E572',
          '#FF9655',
          '#FFF263',
          '#6AF9C4'
        ],
        chart: {
          inverted: true,
          marginTop: 40,
          marginBottom: 0,
          minPadding: 0,
          maxPadding: 0,
          backgroundColor: {
            linearGradient: [0, 0, 500, 500],
            stops: [
              [0, 'rgb(40, 40, 40)'],
              [1, 'rgb(40, 40, 40)']
            ]
          },
          type: 'area',
          zoomType: 'xy'
        },
        title: {
          text: '',
          margin: 0,
          stytle: {
            display: 'none'
          }
        },
        xAxis: {
          minPadding: 0,
          maxPadding: 0,
          //plotLines: [
          //  {
          //    value: 0.152,
          //    zIndex: 10,
          //    width: 2,
          //    dashStyle: 'shortdash',
          //    color: '#fc5857',
          //    label: {
          //      text: '0.152',
          //      rotation: 0,
          //      align: 'left',
          //      style: {
          //        color: '#fc5857'
          //      }
          //    }
          //  },
          //  {
          //    value: 0.15,
          //    zIndex: 10,
          //    width: 2,
          //    dashStyle: 'shortdash',
          //    color: '#fc5857',
          //    label: {
          //      text: '0.15',
          //      rotation: 0,
          //      align: 'left',
          //      style: {
          //        color: '#fc5857'
          //      }
          //    }
          //  },
          //  {
          //    value: 0.143,
          //    zIndex: 10,
          //    width: 2,
          //    dashStyle: 'shortdash',
          //    color: '#fc5857',
          //    label: {
          //      text: '0.143',
          //      rotation: 0,
          //      align: 'left',
          //      style: {
          //        color: '#fc5857'
          //      }
          //    }
          //  },
          //  {
          //    value: 0.147,
          //    zIndex: 10,
          //    width: 2,
          //    dashStyle: 'shortdash',
          //    color: '#fc5857',
          //    label: {
          //      text: '0.147',
          //      rotation: 0,
          //      align: 'left',
          //      style: {
          //        color: '#fc5857'
          //      }
          //    }
          //  },
          //  {
          //    value: 0.15495,
          //    zIndex: 10,
          //    width: 2,
          //    dashStyle: 'shortdash',
          //    color: '#66C167',
          //    label: {
          //      text: '0.15495',
          //      rotation: 0,
          //      align: 'left',
          //      style: {
          //        color: '#66C167'
          //      }
          //    }
          //  },
          //  {
          //    value: 0.158,
          //    zIndex: 10,
          //    width: 2,
          //    dashStyle: 'shortdash',
          //    color: '#66C167',
          //    label: {
          //      text: '0.158',
          //      rotation: 0,
          //      align: 'left',
          //      style: {
          //        color: '#66C167'
          //      }
          //    }
          //  },
          //  {
          //    value: 0.1526,
          //    zIndex: 10,
          //    width: 2,
          //    dashStyle: 'shortdash',
          //    color: '#66C167',
          //    label: {
          //      text: '0.1526',
          //      rotation: 0,
          //      align: 'left',
          //      style: {
          //        color: '#66C167'
          //      }
          //    }
          //  }
          //],
          title: {
            text: 'Price',
            y: -12,
            align: 'high',
            rotation: 0,
            offset: 12
          },
          opposite: true,
          inverted: true,
          lineWidth: 1,
          tickLength: 0,
          reversed: false
          // startOnTick: false,
          // min: 0.5,
        },
        yAxis: {
          opposite: true,
          reversed: true,
          lineWidth: 0,
          gridLineWidth: 0,
          title: null,
          tickWidth: 0,
          tickLength: 0,
          tickPosition: 'inside',
          labels: {
            //align: 'left',
            //step: 0.001,
            //x: -5,
            //padding: 10
          }
        },
        legend: {
          //reversed: true,
          enabled: false
        },
        plotOptions: {
          area: {
            fillOpacity: 0.2,
            lineWidth: 1
          }
        },
        tooltip: {
          headerFormat:
            '<span style="font-size=10px;">Price: {point.key}</span><br/>',
          valueDecimals: 2
        },
        series: [
          {
            name: 'WAX',
            marker: {
              enabled: false
            },
            data: [],
            color: '#fc5857'
          },
          {
            name: 'WAX',
            marker: {
              enabled: false
            },
            data: [],
            color: '#66C167'
          }
        ]
      },
      bids: [],
      asks: [],
      loading: false,
      parentHeight: 0
    }
  },

  computed: {
    ...mapState(['network', 'user', 'userOrders']),
    ...mapGetters('market', ['price']),
    ...mapState('market', [
      'quote_token',
      'base_token',
      'id',
      'deals',
      'markets_layout'
    ]),
    ...mapGetters(['user']),

    ...mapGetters('market', [
      'sorted_asks',
      'sorted_bids'
    ]),

    isLastTradeSell() {
      return this.deals.length > 0 && this.deals[0].type === 'sellmatch'
    },

    percentWarn() {
      return this.getSpreadPercent > 5 ? 'warn' : ''
    }
  },

  watch: {
    markets_layout(_new, old) {
      this.$refs.chart.chart.setSize(
        this.$refs.chartContainer.offsetWidth,
        this.$refs.chartContainer.offsetHeight
      )
    },

    depthChartUpdated(newData, oldData) {
      this.$refs.chart.chart.setSize(
        this.$refs.chartContainer.offsetWidth,
        this.$refs.chartContainer.offsetHeight
      )
    },

    sorted_asks(newAsks, oldAsks) {
      this.setAsks()

      //this.updateChartData(this.asks, this.bids)
    },

    sorted_bids(newBids, oldBids) {
      this.setBids()
    }
  },
  mounted() {
    this.setAsks()
    this.setBids()

    this.$nextTick(() => {
      let chartContrainerInterval = null
      chartContrainerInterval = setInterval(() => {
        if (this.$refs.chartContainer !== undefined && this.$refs.chartContainer.offsetWidth > 0) {
          this.$refs.chart.chart.setSize(
            this.$refs.chartContainer.offsetWidth,
            this.$refs.chartContainer.offsetHeight
          )
          clearInterval(chartContrainerInterval)
        }
      }, 100)
    })
  },
  methods: {
    updateChartData(asks, bids) {
      // this.$refs.chart.chart.series[0].update({ data: asks.slice(0, 5) })
      // this.$refs.chart.chart.series[1].update({ data: bids.slice(0, 5) })
    },

    showmessage(e) {
      e.stopPropagations
    },

    drag(event) {
      event.preventDefault()
      event.stopPropagation()
    },

    setBids() {
      if (!this.$refs.chart.chart) return

      const topPrice = this.sorted_bids[0]

      const bids = {}
      let value = 0

      for (const bid of this.sorted_bids) {
        // This is use to avoid big differences in depth chart
        const priceDiffCoffecient = bid[0] / topPrice[0]
        if (priceDiffCoffecient < 0.1) continue
        //

        value += bid[1]

        if (bids[bid[0]]) {
          bids[bid[0]] = value
        } else {
          bids[bid[0]] = value
        }
      }

      const result = []

      for (const [key, value] of Object.entries(bids)) {
        result.push([
          Number(this.$options.filters.humanPrice(key, 6)),
          value / Math.pow(10, this.base_token.symbol.precision)
        ])
      }

      if (result.length > 0) {
        this.$refs.chart.chart.series[1].setData(result, true, true, true)
      }
    },

    setAsks() {
      if (!this.$refs.chart.chart) return

      const topPrice = this.sorted_asks[0]
      if (!topPrice) return

      const asks = {}
      let value = 0

      for (const ask of this.sorted_asks) {
        const priceDiffCoffecient = ask[0] / topPrice[0]
        if (priceDiffCoffecient > 3) continue

        value += ask[2]

        if (asks[ask[0]]) {
          asks[ask[0]] = value
        } else {
          asks[ask[0]] = value
        }
      }

      const result = []

      for (const [key, value] of Object.entries(asks)) {
        result.push([
          Number(this.$options.filters.humanPrice(key, 6)),
          value / Math.pow(10, this.base_token.symbol.precision)
        ])
      }

      if (result.length > 0) {
        this.$refs.chart.chart.series[0].setData(result, true, true, true)
      }
    }
  }
}
</script>

<style lang="scss">
.depth-chart {
  height: 100%;
  cursor: pointer;
  touch-action: none;
}

.price-title.absolute {
  position: absolute;
  top: 5px;
  right: 10px;
}

.wax-highchart {
  height: 100% !important;
  -webkit-user-select: none;
  -khtml-user-select: none;
  -moz-user-select: none;
  -o-user-select: none;
  user-select: none;
  .highcharts-container {
    height: 100% !important;
    width: 100% !important;
    .highcharts-root {
      height: 100% !important;
      width: 100% !important;
    }
  }
}

.chart-nav.scale-value-nav {
  width: 100% !important;
}

.order-depth .el-tabs__content {
  height: calc(100% - 30px);
  .el-tab-pane,
  .chart-nav,
  .chart-part,
  .wax-highchart {
    height: 100% !important;
  }
}

@media only screen and (max-width: 700px) {
  .blist .ltd span {
    font-size: 10px;
  }

  .display-4 {
    font-size: 1em;
  }
}
</style>
