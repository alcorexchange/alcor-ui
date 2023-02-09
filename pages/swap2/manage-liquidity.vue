<template lang="pug">
#manage-liquidity.w-100
  .d-flex.justify-content-between
    h3.fs-28 LP Positions
    .d-flex.gap-16
      alcor-button
        i.el-icon-info
        span Info
      alcor-button
        i.el-icon-data-line
        span Stats
      alcor-button(orange)
        i.el-icon-arrow-right
        span Migrate
      alcor-button(access @click="openAddLiqidityModal")
        i.el-icon-circle-plus-outline
        span New Position
  .d-flex.justify-content-between.align-items-center.mt-2
    .w-33
      el-input(v-model='search' prefix-icon="el-icon-search" :placeholder="$t('Search by token name')" clearable)
    el-checkbox(v-model='showClosed') {{ $t('show closed positions') }}

  virtual-table.mt-2(:table="virtualTableData")
    template(#row="{ item }")
      pool-row(:pool="item")

</template>

<script>
import { mapActions } from 'vuex'
import AlcorButton from '~/components/AlcorButton'
import VirtualTable from '~/components/VirtualTable'
import PoolRow from '~/components/PoolRow'

export default {
  components: { AlcorButton, VirtualTable, PoolRow },
  data: () => ({
    search: '',
    showClosed: false,
    pools: [
      {
        id: 1,
        input: {
          symbol: 'BRWL',
          contract: 'brawlertoken'
        },
        output: {
          symbol: 'TLM',
          contract: 'alien.worlds'
        },
        min: 4.52,
        max: 12.512,
        inRange: true,
        inputEarning: 552,
        outputEarning: -21,
        percent: 1
      },
      {
        id: 2,
        input: {
          symbol: 'BRWL',
          contract: 'brawlertoken'
        },
        output: {
          symbol: 'TLM',
          contract: 'alien.worlds'
        },
        min: 4.52,
        max: 12.512,
        inRange: false,
        inputEarning: -552,
        outputEarning: 21,
        percent: 1
      },
      {
        id: 3,
        input: {
          symbol: 'BRWL',
          contract: 'brawlertoken'
        },
        output: {
          symbol: 'TLM',
          contract: 'alien.worlds'
        },
        min: 4.52,
        max: 12.512,
        inRange: false,
        inputEarning: -552,
        outputEarning: 21,
        percent: 1
      },
      {
        id: 4,
        input: {
          symbol: 'BRWL',
          contract: 'brawlertoken'
        },
        output: {
          symbol: 'TLM',
          contract: 'alien.worlds'
        },
        min: 4.52,
        max: 12.512,
        inRange: false,
        inputEarning: -552,
        outputEarning: 21,
        percent: 1
      },
      {
        id: 5,
        input: {
          symbol: 'BRWL',
          contract: 'brawlertoken'
        },
        output: {
          symbol: 'TLM',
          contract: 'alien.worlds'
        },
        min: 4.52,
        max: 12.512,
        inRange: false,
        inputEarning: -552,
        outputEarning: 21,
        percent: 1
      },
      {
        id: 6,
        input: {
          symbol: 'BRWL',
          contract: 'brawlertoken'
        },
        output: {
          symbol: 'TLM',
          contract: 'alien.worlds'
        },
        min: 4.52,
        max: 12.512,
        inRange: false,
        inputEarning: -552,
        outputEarning: 21,
        percent: 1
      },
      {
        id: 7,
        input: {
          symbol: 'BRWL',
          contract: 'brawlertoken'
        },
        output: {
          symbol: 'TLM',
          contract: 'alien.worlds'
        },
        min: 4.52,
        max: 12.512,
        inRange: false,
        inputEarning: -552,
        outputEarning: 21,
        percent: 1
      },
      {
        id: 8,
        input: {
          symbol: 'BRWL',
          contract: 'brawlertoken'
        },
        output: {
          symbol: 'TLM',
          contract: 'alien.worlds'
        },
        min: 4.52,
        max: 12.512,
        inRange: false,
        inputEarning: -552,
        outputEarning: 21,
        percent: 1
      }

    ]
  }),
  computed: {
    virtualTableData() {
      const header = [
        {
          label: 'Assets in Position',
          value: 'input.symbol',
          width: '150px',
          sortable: true
        },
        {
          label: 'Range',
          value: 'min',
          width: '200px'
        },
        {
          label: 'Earnings',
          value: 'inputEarning',
          width: '130px'
        },
        {
          label: 'Action',
          width: '150px'
        }
      ]

      const data = this.pools

      const itemSize = 75
      const pageMode = true

      return { pageMode, itemSize, header, data }
    }
  },
  methods: {
    ...mapActions('modal', ['addLiquidity']),
    openAddLiqidityModal() {
      this.addLiquidity()
    }
  }
}
</script>
