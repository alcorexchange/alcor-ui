<template lang="pug">
#migration-modal-component
  .title.fs-18.fw-bold.d-flex.align-items-center.gap-10.mb-3
    i.el-icon-arrow-right
    span Migrate from V1
  .d-flex.gap-16.mt-2
    .fs-18.disable Select Pools
    alcor-button(compact) Select all

  el-table.migration-table.mt-3(:data="tableData" style="width: 504px")
    el-table-column(label="Select" width="70")
      template(slot-scope="{ row }")
        .d-flex.justify-content-center
          el-checkbox(v-model='row.selected')

    el-table-column(label="Pool" width="250")
      template(slot-scope="{ row }")
        .d-flex.gap-8
          pair-icons(:token1="row.input" :token2="row.output")
          .d-flex.flex-column.gap-4
            .fs-20.contrast {{ row.input.symbol }} / {{ row.output.symbol }}
            .fs-14 alcor.dex
    el-table-column(label="Liquidity")
      template(slot-scope="{ row }")
        .d-flex.flex-column.gap-8
          .d-flex.gap-4.align-items-center
            token-image(:src="$tokenLogo(row.input.symbol, row.input.contract)" height="15")
            span {{ row.inputLiquidity }}
          .d-flex.gap-4.align-items-center
            token-image(:src="$tokenLogo(row.output.symbol, row.output.contract)" height="15")
            span {{ row.outputLiquidity }}
    el-table-column(label="TVL")
      template(slot-scope="{ row }")
        .d-flex.gap-4
          span {{ row.tvl }}
          span {{ row.input.symbol }}

  .d-flex.justify-content-end.w-100.mt-3
    alcor-button(access) Migrate
</template>

<script>
import AlcorButton from '~/components/AlcorButton'
import VirtualTable from '~/components/VirtualTable'
import PairIcons from '~/components/PairIcons'
import TokenImage from '~/components/elements/TokenImage'

export default {
  components: { AlcorButton, VirtualTable, PairIcons, TokenImage },
  data: () => ({
    tableData: Array(10).fill({
      input: {
        symbol: 'LOOT',
        contract: 'warsaken'
      },
      output: {
        symbol: 'AETHER',
        contract: 'e.rplanet'
      },
      inputLiquidity: 100,
      outputLiquidity: 1000,
      tvl: 100,
      selected: false
    })
  })
}
</script>

<style lang="scss">
.migration-table {
  border-radius: 8px;
  &.el-table tr,
  &.el-table th {
    background: var(--btn-active);
  }
}
</style>
