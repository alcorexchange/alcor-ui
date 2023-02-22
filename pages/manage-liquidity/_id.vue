<template lang="pug">
h1(v-if="!position") Loading..
#manage-liquidity-id-page(v-else).d-flex.flex-column.gap-24
  | {{ position }}
  .d-flex.justify-content-between.align-items-center
    .d-flex.flex-column.gap-16
      return-link
      .d-flex.gap-32.align-items-center
        .d-flex.flex.gap-4.align-items-center
          //pair-icons(
          //  :token1="pool.input"
          //  :token2="pool.output"
          //)
          //.fs-24.contrast {{ pool.input.symbol }} / {{ pool.output.symbol }}
          .fs-24.contrast {{ pool.tokenA.symbol }} / {{ pool.tokenB.symbol }}
        .d-flex.gap-16
          .tag {{ pool.fee / 10000 }}% Fee
          .tag 90% Selected ( todo )
    .d-flex.gap-16.h-48
      alcor-button
        i.el-icon-circle-plus-outline
        span Increase Liquidity
      alcor-button(danger)
        i.el-icon-remove-outline
        span Remove Liquidity
  .d-flex.gap-32.justify-content-between.w-100
    alcor-container.d-flex.flex-column.gap-16.w-100
      alcor-chart(
        v-if="series"
        :series="series"
        :options="options"
        type="line"
      ).profit-loss
    .d-flex.flex-column.gap-16
      alcor-container.d-flex.flex-column.gap-20.w-550
        .fs-14.disable Selected Pair
        .d-flex.justify-content-between.align-items-center
          .d-flex.gap-8.align-items-center
            token-image(:src="$tokenLogo(position.amountA.currency.symbol, position.amountA.contract)" height="25")
            .fs-24.contrast {{ position.amountA.currency.symbol }}
          .d-flex.gap-8.align-items-center
            .fs-24.disable {{ position.amountA.toFixed() | commaFloat }}
            .tag 59.8% todo
        .d-flex.justify-content-between.align-items-center
          .d-flex.gap-8.align-items-center
            token-image(:src="$tokenLogo('wax', 'eosio.token')" height="25")
            .fs-24.contrast {{ position.amountB.currency.symbol }}
          .d-flex.gap-8.align-items-center
            .fs-24.disable {{ position.amountB.toFixed() | commaFloat }}
            .tag 40.2% todo

      alcor-container.d-flex.flex-column.gap-16.w-550
        .d-flex.justify-content-between.align-items-center
          .d-flex.flex-column.gap-8
            .fs-14.disable Unclaimed Fees
            .fs-40 0.00$
          alcor-button.h-48(access big)
            i.el-icon-money
            span Collect Fees
        .d-flex.justify-content-between.align-items-center
          .d-flex.gap-8.align-items-center
            token-image(:src="$tokenLogo('wax', 'eosio.token')" height="25")
            .fs-24.contrast WAX
          .d-flex.gap-8.align-items-center
            .fs-24.disable 0.00$
            .fs-14.red(:class="{ green: true }") (20.00)

        .d-flex.justify-content-between.align-items-center
          .d-flex.gap-8.align-items-center
            token-image(:src="$tokenLogo('wax', 'eosio.token')" height="25")
            .fs-24.contrast WAX
          .d-flex.gap-8.align-items-center
            .fs-24.disable 23.00
            .fs-14.red(:class="{ green: true }") ($3.00)
  alcor-container.d-flex.flex-column.gap-16.w-100
    .d-flex.justify-content-between
      .d-flex.gap-32.align-items-center
        .fs-14.disable Price Range
        .d-flex.gap-8.align-items-center
          .indicator(:class="{ 'in-range': true }")
          .fs-18 {{ true ? 'In Range': 'Out of Range' }}
    .d-flex.gap-20.justify-content-between.align-items-center
      .grey-border.d-flex.flex-column.gap-20.p-2.br-4.w-50
        .fs-12.text-center Min Price
        .fs-24.text-center.contrast 0.123
        .fs-12.text-center wax per eos

      i.el-icon-sort.r-90

      .grey-border.d-flex.flex-column.gap-20.p-2.br-4.w-50
        .fs-12.text-center Max Price
        .fs-24.text-center.contrast 12.32
        .fs-12.text-center wax per eos

    .grey-border.d-flex.flex-column.gap-20.p-2.br-4.w-100
      .fs-12.text-center Current Price
      .fs-24.text-center 15.8956
      .fs-12.text-center wax per eos
</template>

<script>
import ReturnLink from '~/components/ReturnLink'
import PairIcons from '~/components/PairIcons'
import TokenImage from '~/components/elements/TokenImage'
import AlcorButton from '~/components/AlcorButton'
import AlcorContainer from '~/components/AlcorContainer'
import AlcorChart from '~/components/AlcorChart'

export default {
  components: {
    ReturnLink,
    PairIcons,
    TokenImage,
    AlcorButton,
    AlcorContainer,
    AlcorChart
  },
  data: () => ({
    profitLoss: null,
    series: null,
    options: {
      title: {
        text: 'Profit and Loss',
        align: 'left',
        margin: 0,
        offsetY: 20,
        style: {
          color: 'var(--text-default)',
          fontSize: '10px',
          fontWeight: 400,
          fontFamily: 'Roboto, Arial, sans-serif'
        }
      },

      grid: {
        borderColor: 'var(--border-color)',
        xaxis: { lines: { show: true } },
        yaxis: { lines: { show: true } }
      },

      xaxis: {
        categories: [],
        text: 'Price',
        lines: { show: false },
        type: 'datetime',
        tooltip: { enabled: false },
        axisBorder: { color: 'var(--border-color)' },
        axisTicks: {
          color: 'var(--border-color)',
          height: 6
        },
        labels: {
          datetimeUTC: false,
          style: {
            colors: 'var(--text-default)',
            fontSize: '10px',
            fontFamily: 'Roboto, Arial, sans-serif'
          },
          datetimeFormatter: {
            hour: 'HH:mm'
          }
        }
      },
      yaxis: {
        lines: { show: false },
        opposite: true,
        type: 'numeric',
        axisTicks: {
          show: true,
          color: 'var(--border-color)',
          width: 6
        },
        labels: {
          style: {
            colors: ['var(--text-default)'],
            fontSize: '10px',
            fontFamily: 'Roboto, Arial, sans-serif'
          }
        }
      }
    }
  }),

  computed: {
    position() {
      const [pool_id, position_id, fee] = this.$route.params.id.split('-')
      return this.$store.getters['amm/positions']?.find(p => p.pool.id == pool_id && p.id == position_id && p.pool.fee == fee)
    },

    pool() {
      return this.position?.pool || {}
    },
  },

  watch: {
    position() {
      console.log('get position!', this.position)
    }
  },

  mounted() {
    // TODO RegexTest
    this.$store.dispatch('amm/fetchPositions')
  },

  methods: {
    async fetchProfitLoss() {
      const r = await (
        await fetch('https://alcor.exchange/api/pools/0/charts?period=7D')
      ).json()

      const newData = r.reduce(
        (res, point) => [
          [
            {
              name: 'token1',
              data: [...res[0][0].data, point.price.toFixed(4)]
            },
            {
              name: 'token2',
              data: [...res[0][1].data, point.price_r.toFixed(4)]
            }
          ],
          [...res[1], point.time]
        ],
        [
          [
            {
              name: 'token1',
              data: []
            },
            {
              name: 'token2',
              data: []
            }
          ],
          []
        ]
      )
      const [series, xaxis] = newData
      this.series = series
      this.options.xaxis.categories = xaxis
    }
  }
}
</script>

<style lang="scss">
#manage-liquidity-id-page {
  .h-48 {
    height: 48px;
  }
  .w-550 {
    width: 550px;
  }
  .r-90 {
    transform: rotate(90deg);
  }
  .indicator {
    width: 14px;
    height: 14px;

    background: var(--disabled-indicator);
    border-radius: 2px;

    &.in-range {
      background: var(--access-indicator);
    }
  }
  .tag {
    border: var(--border-1);
    background: var(--bg-alter-2);
    font-size: 10px;
    line-height: 12px;
    padding: 4px;
    border-radius: 4px;
    height: fit-content;
  }
}
</style>
