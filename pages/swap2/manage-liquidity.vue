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
      alcor-button(access)
        i.el-icon-circle-plus-outline
        span New Position
  .d-flex.justify-content-between.align-items-center.mt-2
    .w-33
      el-input(v-model='search' prefix-icon="el-icon-search" :placeholder="$t('Search by token name')" clearable)
    el-checkbox(v-model='showClosed') {{ $t('show closed positions') }}

  virtual-table.mt-2(:table="virtualTableData")
    template(#row="{ item }")
      pre {{ item }}


</template>

<script>
import AlcorButton from '~/components/AlcorButton'
import VirtualTable from '~/components/VirtualTable'

export default {
  components: { AlcorButton, VirtualTable },
  data: () => ({
    search: '',
    showClosed: false
  }),
  computed: {
    virtualTableData() {
      const header = [
        {
          label: 'Assets in Position',
          value: 'quote_name',
          width: '150px',
          sortable: true
        },
        {
          label: 'Range',
          value: 'last_price',
          width: '150px',
          sortable: true
        },
        {
          label: 'Earnings',
          value: 'volume24',
          width: '150px',
          sortable: true,
          desktopOnly: true
        },
        {
          label: 'Action',
          value: 'change24',
          width: '150px',
          sortable: true,
          desktopOnly: true
        }
      ]

      const data = [1, 2, 3, 4]

      const itemSize = 54
      const pageMode = true

      return { pageMode, itemSize, header, data }
    }
  }
}
</script>
