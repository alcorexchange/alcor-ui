<template lang="pug">
el-table.market-table(
  :data='plainPositions',
  style='width: 100%',
  @row-click="managePosition"
)
  el-table-column(:label='$t("Assets in Position")' width="180")
    template(slot-scope='{row}')
      .d-flex.align-items-center.gap-10.p-2
        pair-icons(:token1="row.tokenA" :token2="row.tokenB" size="20")
        .fs-14 {{ row.tokenA.symbol }} / {{ row.tokenB.symbol }}
        .tag {{ row.fee / 10000 }}%

  el-table-column(:label='$t("Range")' width="220")
    template(slot-scope='{row}')
      .d-flex.flex-column
        .d-flex.align-items-center.gap-4
          .indicator(:class="{ 'in-range': row.inRange }")
          .fs-10 {{ !row.inRange ? 'In Range': 'Out of Range' }}
        .d-flex.align-items-center.gap-6.flex-wrap
          .d-flex.gap-4
            .fs-12.disable MIN
            .fs-12.contrast {{ row.priceLower }}
          i.el-icon-sort.rot
          .d-flex.gap-4
            .fs-12.disable MAX
            .fs-12.contrast {{ row.priceUpper }}

  el-table-column(:label='$t("Assets in Pool")')
    template(slot-scope='{row}')
      .d-flex.flex-column.gap-4
        .d-flex.align-items-center.gap-4
          token-image(:src='$tokenLogo(row.tokenA.symbol, row.tokenB.contract)' height="12")

          .fs-12.earn.d-flex.gap-4(:class="{ red: true }")
            span {{ row.amountA }}
        .d-flex.align-items-center.gap-4
          token-image(:src='$tokenLogo(row.tokenB.symbol, row.tokenB.contract)' height="12")

          .fs-12.earn.d-flex.gap-4(:class="{ red: false }")
            span {{ row.amountB }}

  el-table-column(:label='$t("Unclaimed Fees")')
    template(slot-scope='{row}')
      position-fees(:position="row")

  el-table-column(:label='$t("Total Value")')
    template(slot-scope='{row}')
      span $1200

  el-table-column(:label='$t("P&L")')
    template(slot-scope='{row}')
      span.red $-1200

  el-table-column(:label='$t("Action")')
    template(slot-scope='{row}')
      alcor-button Manage

</template>

<script>
import { mapState } from 'vuex'
import PairIcons from '~/components/PairIcons'
import TokenImage from '~/components/elements/TokenImage'
import PositionFees from '~/components/amm/PositionFees'
import AlcorButton from '~/components/AlcorButton'

export default {
  components: { PairIcons, TokenImage, PositionFees, AlcorButton },
  data: () => ({ positions: [] }),

  computed: {
    ...mapState('amm', ['plainPositions'])
  },

  methods: {
    async loadPositions() {
      this.positions = await this.$store.dispatch('amm/getPlainPositions')
    },

    managePosition({ link }) {
      this.$router.push(link)
    }
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
  width: 4px;
  height: 4px;

  background: var(--disabled-indicator);
  border-radius: 50%;

  &.in-range {
    background: var(--access-indicator);
  }
}

</style>
