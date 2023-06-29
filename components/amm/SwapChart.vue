<template lang="pug">
alcor-container.p-3.w-100.chart-container-inner
  .d-flex.justify-content-between
    el-radio-group.custom-radio.p-1.bg-base.br-4(
      v-model='activeTab',
      size='small'
    )
      el-radio-button.pointer(v-for="{ label, value } in tabs" :label='value') {{ label }}

    el-radio-group.custom-radio.p-1.bg-base.br-4(
      v-model='activeTime',
      size='small'
    )
      el-radio-button.pointer(v-for="{ label, value } in times" :label='value') {{ label }}

  //- .p-absolute
    .d-flex.gap-6.align-items-center.p-relative.t-15
      .indicator.primary
      .fs-20 Swap $2.5 B
      .indicator.secondary
      .fs-20 Spot $2.5 B

  component(:is="activeTab" :series="series" :color="activeTab === 'Tvl' ? '#723de4' : undefined")
</template>

<script>
import JSBI from 'jsbi'
import { mapGetters } from 'vuex'

import { Price, Q128 } from '@alcorexchange/alcor-swap-sdk'

import Line from '~/components/charts/Line'
import StackedColumns from '~/components/charts/StackedColumns'
import StepLine from '~/components/charts/StepLine'
import AlcorContainer from '~/components/AlcorContainer'

export default {
  components: {
    Price: Line,
    //Tvl: MultiLine,
    Tvl: Line,
    Depth: StepLine,
    Volume: StackedColumns,
    Fees: StackedColumns,
    AlcorContainer,
  },

  data: () => ({
    charts: [],
    activeTab: 'Price',
    activeTime: '7D',
    times: [
      { label: '1D', value: '24H' },
      { label: '7D', value: '7D' },
      { label: '30D', value: '30D' },
      { label: 'All', value: 'All' },
    ],
  }),

  computed: {
    tabs() {
      return [
        { label: this.$t('Price'), value: 'Price' },
        { label: this.$t('TVL'), value: 'Tvl' },
        { label: this.$t('Volume'), value: 'Volume' },
        // { label: 'Fees', value: 'Fees' },
        // { label: 'Depth', value: 'Depth' }
      ]
    },
    ...mapGetters('amm/swap', [
      'tokenA',
      'tokenB',
      // 'tokens',
      // 'isSorted',
      'sortedA',
      'sortedB',
    ]),

    // series() {
    //   if (this.activeTab == 'Price') {
    //     return {
    //       name: 'Price',
    //       data: this.charts.map(c => {
    //         //const price = new Price(sortedA, sortedB, Q128, JSBI.multiply(JSBI.BigInt(c.price), JSBI.BigInt(c.price)))

    //         return {
    //           x: c._id,
    //           //y: parseFloat(price.toSignificant())
    //           y: Math.random() * 100
    //         }
    //       })
    //     }
    //   }

    //   if (this.activeTab == 'Tvl') {
    //     return {
    //       name: 'TVL',
    //       data: this.charts.map(c => {
    //         return {
    //           x: c._id,
    //           y: c.usdReserveA + c.usdReserveB
    //         }
    //       })
    //     }
    //   }
    //   return []
    // },
    series() {
      return this[`${this.activeTab}Series`]
    },

    TvlSeries() {
      const { sortedA, sortedB } = this

      let data = []

      if (sortedA && sortedB) {
        data = this.charts.map((c) => {
          return {
            x: c._id,
            y: c.usdReserveA + c.usdReserveB,
          }
        })
      }

      return [
        {
          name: 'Price',
          data,
        },
      ]
    },

    PriceSeries() {
      const { sortedA, sortedB } = this

      let data = []

      if (sortedA && sortedB) {
        data = this.charts.map((c) => {
          const price = new Price(
            sortedA,
            sortedB,
            Q128,
            JSBI.multiply(JSBI.BigInt(c.price), JSBI.BigInt(c.price))
          )

          return {
            x: c._id,
            y: parseFloat(price.toSignificant()),
          }
        })
      }

      return [
        {
          name: 'Price',
          data,
        },
      ]
    },

    VolumeSeries() {
      const { sortedA, sortedB } = this

      let data = []

      if (sortedA && sortedB) {
        data = this.charts.map((c) => {
          return {
            x: c._id,
            y: c.volumeUSD,
          }
        })
      }

      return [
        {
          name: 'Volume',
          data,
        },
      ]
    },
  },

  watch: {
    activeTime() {
      this.fetchCharts()
    },

    tokenA(from, to) {
      if (from && to && from.id == to.id) return
      this.fetchCharts()
    },

    tokenB(from, to) {
      if (from && to && from.id == to.id) return
      this.fetchCharts()
    },
  },

  mounted() {
    // FIXME: setTimeout because I get Network Error on page reload
    setTimeout(() => {
      this.fetchCharts()
    }, 100)
  },

  methods: {
    async fetchCharts() {
      console.log('fetchCharts')
      if (!this.tokenA || !this.tokenB) return
      try {
        const { data } = await this.$axios.get('/v2/swap/charts', {
          params: {
            period: this.activeTime,
            tokenA: this.tokenA.id,
            tokenB: this.tokenB.id,
          },
        })
        this.charts = data
      } catch (e) {
        console.log('Getting Chart E', e)
      }
    },
  },
}
</script>

<style scoped lang="scss">
.chart-container-inner {
  padding: 8px 12px !important;
}
.custom-radio {
  display: flex !important;
  flex-wrap: nowrap;
  padding: 2px !important;
  gap: 2px;
  &::v-deep {
    .el-radio-button__inner {
      padding: 6px 8px !important;
      font-size: 14px !important;
    }
  }
}
.indicator {
  border-radius: 50%;
  width: 9px;
  height: 9px;
  &.primary {
    background-color: rgb(63, 81, 181);
  }
  &.secondary {
    background-color: rgb(3, 169, 244);
  }
}
</style>
