<template lang="pug">
.depth-chart
  highchart(
    ref='chart',
    :options='chartOptions',
    :redraw='true',
    :update='["options", "options.title", "options.series"]'
  )
</template>

<script>
import { mapGetters, mapState } from 'vuex'
import { trade } from '~/mixins/trade'

export default {
  mixins: [trade],

  data() {
    return {
      chartOptions: {
        credits: {
          enabled: false,
        },
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
              value: 0.144,
              zIndex: 2,
              width: 2,
              dashStyle: 'dotDash',
              color: 'black',
              label: {
                text: '0.144',
                rotation: 0,
              },
            },
          ],
          title: {
            text: 'Price',
          },
        },
        yAxis: [
          {
            lineWidth: 0,
            gridLineWidth: 0,
            title: null,
            tickWidth: 0,
            tickLength: 0,
            tickPosition: 'inside',
            labels: {
              align: 'left',
              x: 8,
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
            data: [],
            color: '#03a7a8',
          },
          {
            name: 'Asks',
            marker: {
              enabled: false,
            },
            data: [],
            color: '#fc5857',
          },
        ],
      },
      bids: [],
      asks: [],
      loading: false,
    }
  },

  computed: {
    ...mapState(['network', 'user', 'userOrders']),
    ...mapGetters('market', ['price']),
    ...mapState('market', ['quote_token', 'base_token', 'id', 'deals']),
    ...mapGetters(['user']),

    isLastTradeSell() {
      return this.deals.length > 0 && this.deals[0].type === 'sellmatch'
    },

    percentWarn() {
      return this.getSpreadPercent > 5 ? 'warn' : ''
    },
  },

  watch: {
    sorted_asks(newAsks, oldAsks) {
      this.asks = []
      for (let i = 0; i < 20; i++) {
        this.asks.push([newAsks[i][0], newAsks[i][1]])
      }
      this.updateChartData(this.asks, this.bids)
    },
    sorted_bids(newBids, oldBids) {
      this.bids = []
      for (let i = 0; i < 20; i++) {
        this.bids.push([newBids[i][0], newBids[i][1]])
      }
      this.updateChartData(this.asks, this.bids)
    },
  },

  methods: {
    updateChartData(asks, bids) {
      this.$refs.chart.chart.series[0].update({ data: asks.slice(0, 5) })
      this.$refs.chart.chart.series[1].update({ data: bids.slice(0, 5) })
    },
  },
  mounted() {
    setTimeout(() => {
      this.$refs.chart.chart.setSize(250, 350)
    }, 100)
  },
}
</script>

<style lang="scss">
.depth-chart {
  height: 100%;
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
