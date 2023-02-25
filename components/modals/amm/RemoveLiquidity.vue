<template lang="pug">
.d-flex.align-items-center.gap-8
  alcor-button(danger @click="visible = true") Remove Liquidity
    i.el-icon-remove-outline

  //append-to-body
  el-dialog.remove-liquidity(
    title="Remove Liquidity"
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
          range-indicator(:inRange="true")
        alcor-container(:alternative="true").d-flex.flex-column.gap-8.w-100
          .fs-16.disable Amount
          .d-flex.justify-content-between.align-items-center
            .fs-36 {{ percent }}%
            .d-flex.gap-8
              alcor-button(compact v-for="v in ['25%', '50%', '75%', 'max']" @click="setPercent(v)") {{ v }}

          el-slider(
            :step="1"
            v-model="percent"
            :marks="{ 0: '0%', 25: '25%', 50: '50%', 75: '75%', 100: '100%' }"
            :show-tooltip="false"
          ).slider-sell.px-2.mb-3

        alcor-container(:alternative="true").d-flex.flex-column.gap-10.w-100
          .d-flex.justify-content-between.align-items-center
            .contrast Pooled TOKEN1:
            .d-flex.gap-8.align-items-center
              .fs-14 0
              token-image(:src="$tokenLogo('symbol', 'contract')" height="25")
          .d-flex.justify-content-between.align-items-center
            .contrast Pooled TOKEN2:
            .d-flex.gap-8.align-items-center
              .fs-14 0
              token-image(:src="$tokenLogo('symbol', 'contract')" height="25")
          .hr
          .d-flex.justify-content-between.align-items-center
            .contrast TOKEN1 Fees Earned:
            .d-flex.gap-8.align-items-center
              .fs-14 0
              token-image(:src="$tokenLogo('symbol', 'contract')" height="25")
          .d-flex.justify-content-between.align-items-center
            .contrast TOKEN2 Fees Earned:
            .d-flex.gap-8.align-items-center
              .fs-14 0
              token-image(:src="$tokenLogo('symbol', 'contract')" height="25")

        .d-flex.justify-content-between.align-items-center
          .contrast Collect as TOKEN1
          el-switch(
            v-model='switchModel',
            active-color='#13ce66',
            inactive-color='#161617'
          )

        alcor-button.w-100(big @click="remove") Enter a percent
</template>

<script>
import AlcorButton from '~/components/AlcorButton.vue'
import AlcorModal from '~/components/AlcorModal.vue'
import CompactTabs from '~/components/CompactTabs.vue'
import TokenImage from '~/components/elements/TokenImage'
import PairIcons from '~/components/PairIcons'
import RangeIndicator from '~/components/amm/RangeIndicator'
import AlcorContainer from '~/components/AlcorContainer'

export default {
  components: {
    AlcorModal,
    CompactTabs,
    TokenImage,
    AlcorButton,
    PairIcons,
    RangeIndicator,
    AlcorContainer
  },

  props: ['position'],

  data: () => ({
    percent: 0,
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
    },

    remove() {

    },

    setPercent(percent) {
      if (percent == 'max') return this.percent = 100
      this.percent = parseInt(percent)
    }
  }
}
</script>

<style lang="scss">
.remove-liquidity {
  .el-dialog {
    width: 460px;
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
