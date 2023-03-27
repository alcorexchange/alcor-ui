<template lang="pug">
.depricated-pools.mt-4(v-if="[].length")
  .fs-20.mb-3 Depricated Pools
  el-table.position-table.custom-responsive-table(
    :data='plainPositions',
    style='width: 100%',
    @row-click='$emit("positionClick", $event)'
  )
    //- TODO: Hide  on empty
    el-table-column(
      :label='$t("Assets in Position")',
      width='240',
      className='assets'
    )
      template(slot-scope='{ row }')
        .assets-inner.d-flex.align-items-center.gap-12.px-3.py-2
          pair-icons(:token1='row.tokenA', :token2='row.tokenB', size='20')
          .fs-14 {{ row.tokenA.symbol }} / {{ row.tokenB.symbol }}
          .tag {{ row.fee / 10000 }}%

    el-table-column(:label='$t("Network")', width='220', class-name='min-max')
      template(slot-scope='{ row }')
        .d-flex.align-items-center.gap-8
          TokenImage(
            :src='$tokenLogo(row.tokenB.symbol, row.tokenB.contract)',
            height='20'
          )
          div {{ row.tokenB.symbol }}

    el-table-column(:label='$t("Assets in Pool")', width='160')
      template(slot-scope='{ row }')
        .d-flex.flex-column
          .mobile-label {{ $t('Assets in Pool') }}
          .d-flex.align-items-center.gap-4
            TokenImage(
              :src='$tokenLogo(row.tokenA.symbol, row.tokenA.contract)',
              height='12'
            )

            .fs-12.earn.d-flex.gap-4
              span {{ row.amountA }}
          .d-flex.align-items-center.gap-4
            TokenImage(
              :src='$tokenLogo(row.tokenB.symbol, row.tokenB.contract)',
              height='12'
            )

            .fs-12.earn.d-flex.gap-4(:class='{ red: false }')
              span {{ row.amountB }}

    el-table-column(
      :label='$t("Action")',
      align='right',
      class-name='actions-container'
    )
      template(slot-scope='{ row }')
        .actions.d-flex.gap-8.justify-content-end
          AlcorButton(compact) Create Pool
          AlcorButton(compact) Migrate
</template>

<script>
import { mapGetters } from 'vuex'

import PairIcons from '~/components/PairIcons'
import TokenImage from '~/components/elements/TokenImage'
import PositionFees from '~/components/amm/PositionFees'
import AlcorButton from '~/components/AlcorButton'

export default {
  components: { PairIcons, TokenImage, PositionFees, AlcorButton },
  computed: {
    ...mapGetters('amm', ['plainPositions']),
  },
}
</script>

<style lang="scss" scoped>
.rot {
  transform: rotate(90deg);
}
.tag {
  border: var(--border-1);
  background: var(--bg-alter-2);
  font-size: 10px;
  line-height: 12px;
  padding: 4px;
  border-radius: 4px;
}
.indicator {
  width: 6px;
  height: 6px;

  background: var(--disabled-indicator);
  border-radius: 50%;

  &.in-range {
    background: var(--access-indicator);
  }
}
</style>

<style lang="scss">
.depricated-pools {
  .position-table {
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
}

@media only screen and (max-width: 1100px) {
  .depricated-pools {
    .assets {
      grid-column: 1 / 3;
      .assets-inner {
        padding: 8px 0 !important;
      }
    }
    .unclaimed-fees {
      margin-left: auto;
      .cell {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
      }
      .position-fees {
        align-items: flex-end;
      }
    }
    .actions-container {
      align-items: end;
      justify-content: end;
      .cell{
        padding: 0 !important;
      }
    }
  }
}
</style>
