<template lang="pug">
.d-flex.align-items-center.gap-8
  alcor-button(@click="visible = true")
    i.el-icon-circle-plus-outline
    span Increase Liquidity

  //append-to-body
  el-dialog.increase-liquidity(
    title="Increase Liquidity"
    :visible="visible"
    @close="visible = false"

    :before-close="beforeDialogClose"
    @mousedown.native="dialogMousedown"
    @mouseup.native="dialogMouseup"
  )
    .row(v-if="position")
      .col.d-flex.flex-column.gap-16
        .d-flex.justify-content-between
          .d-flex.align-items-center.gap-8
            pair-icons(
              :token1="position.pool.tokenA"
              :token2="position.pool.tokenB"
            )
            .fs-18 {{ position.pool.tokenA.symbol }}/{{ position.pool.tokenB.symbol }}
          range-indicator(:inRange="position.inRange")

        alcor-container(:alternative="true").d-flex.flex-column.gap-10.w-100
          .d-flex.justify-content-between.align-items-center
            .d-flex.gap-8.align-items-center
              token-image(:src="$tokenLogo(position.pool.tokenA.symbol, position.pool.tokenA.symbol.contract)" height="25")
              .fs-14.contrast {{ position.pool.tokenA.symbol }}
            .contrast {{ position.amountA.toFixed() }}
          .d-flex.justify-content-between.align-items-center
            .d-flex.gap-8.align-items-center
              token-image(:src="$tokenLogo(position.pool.tokenB.symbol, position.pool.tokenB.symbol.contract)" height="25")
              .fs-14.contrast {{ position.pool.tokenB.symbol }}
            .contrast {{ position.amountB.toFixed() }}
          .hr
          .d-flex.justify-content-between.align-items-center
            .contrast Fee Tier
            .fs-14 {{ position.pool.fee / 10000 }}%

        .d-flex.justify-content-between.align-items-center
          .disable Selected Range
          //- el-radio-group(
          //-   v-model='tokenMode',
          //-   size='small'
          //- )
          //-   el-radio-button(label='TOKEN1')
          //-   el-radio-button(label='TOKEN2')

        .d-flex.gap-20.justify-content-between.align-items-center
          alcor-container(:alternative="true").d-flex.flex-column.gap-6.w-100
            .fs-12.text-center.disable Min Price
            .fs-24.text-center.contrast {{ position.tokenAPriceLower.toFixed() }}
            .fs-12.text-center.disable wax per eos

          i.el-icon-sort.r-90

          alcor-container(:alternative="true").d-flex.flex-column.gap-6.w-100
            .fs-12.text-center.disable Max Price
            .fs-24.text-center.contrast {{ position.tokenAPriceUpper.toFixed() }}
            .fs-12.text-center.disable wax per eos

        alcor-container(:alternative="true").d-flex.flex-column.gap-6.w-100
          .fs-12.text-center.disable Current Price
          .fs-24.text-center {{ position.pool.tokenAPrice.toFixed() }}
          .fs-12.text-center.disable wax per eos

        .contrast Add more liquidity
        PoolTokenInput(:locked="true" :token="position.pool.tokenA" v-model="amountA")
        PoolTokenInput(:locked="true" :token="position.pool.tokenB" v-model="amountB")

        alcor-button.w-100(big) Enter an amount

</template>

<script>
import AlcorButton from '~/components/AlcorButton.vue'
import AlcorModal from '~/components/AlcorModal.vue'
import CompactTabs from '~/components/CompactTabs.vue'
import TokenImage from '~/components/elements/TokenImage'
import PairIcons from '~/components/PairIcons'
import RangeIndicator from '~/components/amm/RangeIndicator'
import AlcorContainer from '~/components/AlcorContainer'
import PoolTokenInput from '~/components/amm/PoolTokenInput'

export default {
  components: {
    AlcorModal,
    CompactTabs,
    TokenImage,
    AlcorButton,
    PairIcons,
    RangeIndicator,
    PoolTokenInput,
    AlcorContainer
  },

  props: ['position'],

  data: () => ({
    tokenMode: null,
    visible: false,

    search: '',
    tab: 'all',
    selected: null,

    tabs: [
      { label: 'Owned', value: 'owned' },
      { label: 'All', value: 'all' }
    ]
  }),
  computed: {
    filteredAssets() {
      return this.assets.filter((asset) =>
        Object.values(asset)
          .join()
          .includes(this.search)
      )
    }
  },
  methods: {
    selectAsset(v) {
      this.$emit('selected', v)
      this.visible = false
    }
  }
}
</script>

<style lang="scss">
.increase-liquidity {
  .el-dialog {
    width: 480px;
  }
}
/* .select-token-modal { */
/*   .el-dialog { */
/*     width: 400px; */
/*     max-width: 400px; */
/*   } */
/*   .el-dialog__body { */
/*     padding: 0px; */
/*   } */
/*   .body .el-input .el-input__inner { */
/*     background: var(--select-color); */
/*     border-radius: 4px; */
/*   } */

/*   hr { */
/*     background: var(--border-color); */
/*   } */

/*   .select-token-button { */
/*     display: flex; */
/*     align-items: center; */

/*     padding: 5px 9px; */
/*     border: 1px solid; */
/*     border-radius: 4px; */
/*     cursor: pointer; */

/*     &:hover { */
/*       border-color: white; */
/*     } */
/*   } */
/* } */
</style>
