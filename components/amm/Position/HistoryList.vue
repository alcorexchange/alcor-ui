<template lang="pug">
.table-and-filter
  HistoryFilter.mb-2(v-model="filter" v-if="isMobile")
  el-table.history-table(
    :data='plainPositions',
    style='width: 100%',
  )
    template(#empty)
      .d-flex.flex-column.align-items-center.gap-30.py-5
        i.el-icon-moon-night.fs-40
        .fs-14.lh-14 Your position history will appear here.
    el-table-column(width="240" class-name="type")
      template(#header)
        HistoryFilter(v-model="filter" v-if="!isMobile")
      template(slot-scope='{row}') Swap WAX for BLK

    el-table-column(:label='$t("Network")', width='220' class-name="network")
      template(slot-scope='{ row }')
        .d-flex.align-items-center.gap-8
          TokenImage(
            :src='$tokenLogo(row.tokenB.symbol, row.tokenB.contract)',
            height='20'
          )
          div {{ row.tokenB.symbol }}

    el-table-column(:label='$t("Total Value")' width="160" )
      template(slot-scope='{row}')
        .d-flex.flex-column.gap-4
          .mobile-label Total Value
          span $558,001.05

    el-table-column(:label='$t("Token Amount")' width="160" class-name="token-amount")
      template(slot-scope='{row}')
        .token-amount-inner.d-flex.flex-column.gap-4
          .mobile-label Token Amount
          span $558,001.05

    el-table-column(:label='$t("Account")' width="100")
      template(slot-scope='{row}')
        .d-flex.flex-column.gap-4
          .mobile-label Account
          span eos.name
    el-table-column(:label='$t("Time")' align="right" class-name="time")
      template(slot-scope='{row}') 2d ago

</template>

<script>
import { mapGetters } from 'vuex'

import TokenImage from '~/components/elements/TokenImage'
import HistoryFilter from '~/components/amm/Position/HistoryFilter'

export default {
  components: { TokenImage, HistoryFilter },
  data: () => ({
    filter: 'All'
  }),
  computed: {
    ...mapGetters('amm', ['plainPositions'])
  },
}
</script>

<style lang="scss">
.history-table {
  border-radius: 12px;
  .el-table__header {
    th {
      font-weight: 400 !important;
      font-size: 12px !important;
      color: var(--text-disable);
      .cell {
        padding: 0px 16px;
      }
    }
  }
  .el-table__row {
    cursor: pointer;
  }
}
.mobile-label {
  display: none;
}
.type {
  color: var(--main-green);
}
.el-table__cell {
  border-top: none !important;
}
@media only screen and (max-width: 1100px) {
  .mobile-label{
    display: block;
  }
  .el-table__header-wrapper {
    display: none;
  }
  .el-table__body {
    width: auto !important;
    display: flex;
  }
  tbody {
    flex: 1;
  }
  colgroup {
    display: none;
  }
  .el-table__row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    padding: 8px;
    &:hover {
      background: var(--hover) !important;
    }
  }
  .el-table__cell {
    display: flex;
    padding: 0 !important;
    border-bottom: none !important;
    background-color: transparent !important;
    .cell{
      padding: 0 !important;
    }
  }
  .network, .token-amount, .time {
    justify-content: flex-end;
  }
  .token-amount-inner{
    align-items: flex-end;
  }
  .time .cell{
    display: flex;
    align-items: flex-end;
  }
  // we need styling from parent so it overtakes default style specified in dark.css L: 3265
  body .el-table--enable-row-hover .el-table__body tr:hover{
    .el-table__cell {
      background-color: transparent !important;
    }
  }
}
</style>
