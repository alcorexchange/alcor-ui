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
import { trade } from '~/mixins/trade'

export default {
  mixins: [trade],
  props: ['depthChartUpdated'],
  data() {
    return {
      chartOptions: {
        credits: {
          enabled: false,
          align: 'right',
          verticalAlign: 'bottom',
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
          '#6AF9C4',
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
              [1, 'rgb(40, 40, 40)'],
            ],
          },
          type: 'area',
          zoomType: 'xy',
        },
        title: {
          text: '',
          margin: 0,
          stytle: {
            display: 'none',
          },
        },
        xAxis: {
          minPadding: 0,
          maxPadding: 0,
          plotLines: [
            {
              value: 0.152,
              zIndex: 10,
              width: 2,
              dashStyle: 'shortdash',
              color: '#fc5857',
              label: {
                text: '0.152',
                rotation: 0,
                align: 'left',
                style: {
                  color: '#fc5857',
                },
              },
            },
            {
              value: 0.15,
              zIndex: 10,
              width: 2,
              dashStyle: 'shortdash',
              color: '#fc5857',
              label: {
                text: '0.15',
                rotation: 0,
                align: 'left',
                style: {
                  color: '#fc5857',
                },
              },
            },
            {
              value: 0.143,
              zIndex: 10,
              width: 2,
              dashStyle: 'shortdash',
              color: '#fc5857',
              label: {
                text: '0.143',
                rotation: 0,
                align: 'left',
                style: {
                  color: '#fc5857',
                },
              },
            },
            {
              value: 0.147,
              zIndex: 10,
              width: 2,
              dashStyle: 'shortdash',
              color: '#fc5857',
              label: {
                text: '0.147',
                rotation: 0,
                align: 'left',
                style: {
                  color: '#fc5857',
                },
              },
            },
            {
              value: 0.15495,
              zIndex: 10,
              width: 2,
              dashStyle: 'shortdash',
              color: '#66C167',
              label: {
                text: '0.15495',
                rotation: 0,
                align: 'left',
                style: {
                  color: '#66C167',
                },
              },
            },
            {
              value: 0.158,
              zIndex: 10,
              width: 2,
              dashStyle: 'shortdash',
              color: '#66C167',
              label: {
                text: '0.158',
                rotation: 0,
                align: 'left',
                style: {
                  color: '#66C167',
                },
              },
            },
            {
              value: 0.1526,
              zIndex: 10,
              width: 2,
              dashStyle: 'shortdash',
              color: '#66C167',
              label: {
                text: '0.1526',
                rotation: 0,
                align: 'left',
                style: {
                  color: '#66C167',
                },
              },
            },
          ],
          title: {
            text: 'Price',
            y: -12,
            align: 'high',
            rotation: 0,
            offset: 12,
          },
          opposite: true,
          inverted: true,
          lineWidth: 1,
          tickLength: 0,
          // startOnTick: false,
          // min: 0.5,
        },
        yAxis: [
          {
            opposite: true,
            reversed: true,
            lineWidth: 0,
            gridLineWidth: 0,
            title: null,
            tickWidth: 0,
            tickLength: 0,
            tickPosition: 'inside',
            labels: {
              align: 'left',
              step: 1,
              x: -5,
              padding: 30,
            },
          },
        ],
        legend: {
          enabled: false,
        },
        plotOptions: {
          area: {
            fillOpacity: 0.2,
            lineWidth: 1,
          },
        },
        tooltip: {
          headerFormat:
            '<span style="font-size=10px;">Price: {point.key}</span><br/>',
          valueDecimals: 2,
        },
        series: [
          {
            name: 'Bids',
            marker: {
              enabled: false,
            },
            data: [
              [0.1524, 0.948665],
              [0.1539, 35.510715],
              [0.154, 39.883437],
              [0.1541, 40.499661],
              [0.1545, 43.262994000000006],
              [0.1547, 60.14799400000001],
              [0.1553, 60.30799400000001],
              [0.1558, 60.55018100000001],
              [0.1564, 68.381696],
              [0.1567, 69.46518400000001],
              [0.1569, 69.621464],
              [0.157, 70.398015],
              [0.1574, 70.400197],
              [0.1575, 73.199217],
              [0.158, 77.700017],
              [0.1583, 79.449017],
              [0.1588, 79.584064],
              [0.159, 80.584064],
              [0.16, 81.58156],
              [0.1608, 83.38156],
            ],
            color: '#66C167',
          },
          {
            name: 'Asks',
            marker: {
              enabled: false,
            },
            data: [
              [0.1435, 242.521842],
              [0.1436, 206.49862099999999],
              [0.1437, 205.823735],
              [0.1438, 197.33275],
              [0.1439, 153.677454],
              [0.144, 146.007722],
              [0.1442, 82.55212900000001],
              [0.1443, 59.152814000000006],
              [0.1444, 57.942260000000005],
              [0.1445, 57.483850000000004],
              [0.1446, 52.39210800000001],
              [0.1447, 51.867208000000005],
              [0.1448, 44.104697],
              [0.1449, 40.131217],
              [0.145, 31.878217],
              [0.1451, 22.794916999999998],
              [0.1453, 12.345828999999998],
              [0.1454, 10.035642],
              [0.148, 9.326642],
              [0.1522, 3.76317],
            ],
            color: '#fc5857',
          },
        ],
      },
      bids: [],
      asks: [],
      loading: false,
      parentHeight: 0,
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
      'markets_layout',
    ]),
    ...mapGetters(['user']),

    isLastTradeSell() {
      return this.deals.length > 0 && this.deals[0].type === 'sellmatch'
    },

    percentWarn() {
      return this.getSpreadPercent > 5 ? 'warn' : ''
    },
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
    // sorted_asks(newAsks, oldAsks) {
    //   this.asks = []
    //   for (let i = 0; i < 20; i++) {
    //     this.asks.push([newAsks[i][0], newAsks[i][1]])
    //   }
    //   this.updateChartData(this.asks, this.bids)
    // },
    // sorted_bids(newBids, oldBids) {
    //   this.bids = []
    //   for (let i = 0; i < 20; i++) {
    //     this.bids.push([newBids[i][0], newBids[i][1]])
    //   }
    //   this.updateChartData(this.asks, this.bids)
    // },
  },
  mounted() {
    this.$nextTick(() => {
      let chartContrainerInterval = null
      chartContrainerInterval = setInterval(() => {
        if (this.$refs.chartContainer.offsetWidth > 0) {
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
  },
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
  height: calc(100% - 55px);
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
