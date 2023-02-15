<template lang="pug">
#manage-liquidity.w-100
  .d-flex.flex-column.flex-xl-row.justify-content-between
    h3.fs-28.text-center.text-md-left LP Positions
    .d-flex.gap-16.flex-wrap.justify-content-center.justify-content-md-start
      alcor-button
        i.el-icon-info
        span Info
      alcor-button
        i.el-icon-data-line
        span Stats
      alcor-button(orange @click="openMigrationModal")
        i.el-icon-arrow-right
        span Migrate
      alcor-button(access @click="openAddLiqidityModal")
        i.el-icon-circle-plus-outline
        span New Position
  .d-flex.justify-content-between.align-items-center.mt-2.gap-8
    .w-50
      el-input(v-model='search' prefix-icon="el-icon-search" :placeholder="$t('Search by token name')" clearable)
    el-checkbox(v-model='showClosed') {{ $t('show closed positions') }}

  // TODO Ломает функции объектов
  //virtual-table.mt-2(:table="virtualTableData")
    template(#row="{ item }")
      //pool-row(:position="item")

  pool-row(v-for="position of positions" :position="position")

</template>

<script>
import { mapActions, mapGetters } from 'vuex'
import AlcorButton from '~/components/AlcorButton'
import VirtualTable from '~/components/VirtualTable'
import PoolRow from '~/components/PoolRow'

export default {
  components: { AlcorButton, VirtualTable, PoolRow },
  data: () => ({
    search: '',
    showClosed: false
  }),
  computed: {
    ...mapGetters('amm', ['positions']),

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

      const itemSize = 75
      const pageMode = true

      let i = 0
      return {
        pageMode,
        itemSize,
        header,
        data: this.positions.map(p => {
          p.id = i
          i++
          return p
        })
      }
    }
  },
  methods: {
    ...mapActions('modal', ['addLiquidity', 'migration']),
    openAddLiqidityModal() {
      this.addLiquidity()
    },
    openMigrationModal() {
      this.migration()
    }
  }
}
</script>
