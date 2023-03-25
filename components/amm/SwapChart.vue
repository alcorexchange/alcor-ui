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

  .p-absolute
    .d-flex.gap-6.align-items-center.p-relative.t-15
      .indicator.primary
      .fs-20 Swap $2.5 B
      .indicator.secondary
      .fs-20 Spot $2.5 B

  component(:is="activeTab" :series="series")
</template>

<script>
import { mapGetters } from 'vuex'

import { Price, Q128 } from '~/assets/libs/swap-sdk'

import Line from '~/components/charts/Line'
import StackedColumns from '~/components/charts/StackedColumns'
import MultiLine from '~/components/charts/MultiLine'
import StepLine from '~/components/charts/StepLine'
import AlcorContainer from '~/components/AlcorContainer'
import { littleEndianToDesimal, littleEndianToDesimalString } from '~/utils'

export default {
  components: {
    Price: Line,
    Tvl: MultiLine,
    Depth: StepLine,
    Volume: StackedColumns,
    Fees: StackedColumns,
    AlcorContainer,
  },

  data: () => ({
    charts: [],
    activeTab: 'Price',
    tabs: [
      { label: 'Price', value: 'Price' },
      // { label: 'TVL', value: 'Tvl' },
      // { label: 'Volume', value: 'Volume' },
      // { label: 'Fees', value: 'Fees' },
      // { label: 'Depth', value: 'Depth' }
    ],
    activeTime: '24H',
    times: [
      { label: '1D', value: '24H' },
      { label: '7D', value: '7D' },
      { label: '30D', value: '30D' },
      { label: 'All', value: 'All' }
    ]
  }),

  computed: {
    ...mapGetters('amm/swap', [
      // 'tokenA',
      // 'tokenB',
      // 'tokens',
      // 'isSorted',
      'sortedA',
      'sortedB'
    ]),

    series() {
      return this[this.activeTab + 'Series']
    },

    PriceSeries() {
      const { sortedA, sortedB } = this


      const data = this.charts.map(c => {
        if (sortedA || sortedB) {
          //const price = new Price(sortedA, sortedB, Q128, JSBI.multiply(littleEndianToDesimal(c.price), littleEndianToDesimal(c.price)))
          //console.log(price.toSignificant(), c.price, littleEndianToDesimal(c.price))
          console.log(c.price, littleEndianToDesimal(c.price), littleEndianToDesimalString(c.price))
        }

        return {
          x: c._id,
          y: Math.random() * 100
        }
      })

      return [
        {
          name: 'Price',
          data
        }
      ]
    },
  },

  watch: {
    activeTime() {
      this.fetchCharts()
    }
  },

  mounted() {
    this.fetchCharts()
  },

  methods: {
    async fetchCharts() {
      this.charts = (await this.$axios.get('/v2/swap/charts?tokenA=tlm-alien.worlds&tokenB=wax-eosio.token', {
        params: { period: this.activeTime }
      })).data
    }
  }
}
</script>

<style scoped lang="scss">
.custom-radio {
  display: flex !important;
  flex-wrap: nowrap;
  padding: 2px !important;
  gap: 2px;
  &::v-deep {
    .el-radio-button__inner{
      padding: 6px 8px !important;
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
