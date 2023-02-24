<template lang="pug">
.d-flex.align-items-center.gap-8
  alcor-button.h-48(access big @click="locked ? '' : visible = true")
    i.el-icon-money
    span Collect Fees

  //append-to-body
  el-dialog.increase-liquidity(
    title="Claim Fees"
    :visible="visible"
    @close="visible = false"

    :before-close="beforeDialogClose"
    @mousedown.native="dialogMousedown"
    @mouseup.native="dialogMouseup"
  )
    .row
      .col.d-flex.flex-column.gap-16
        alcor-container(:alternative="true").d-flex.flex-column.gap-10.w-100
          .d-flex.justify-content-between.align-items-center
            .d-flex.gap-8.align-items-center
              token-image(:src="$tokenLogo('symbol', 'contract')" height="25")
              .fs-14.contrast 0.0007746
            .disable TOKEN1
          .d-flex.justify-content-between.align-items-center
            .d-flex.gap-8.align-items-center
              token-image(:src="$tokenLogo('symbol', 'contract')" height="25")
              .fs-14.contrast 0.0007746
            .disable TOKEN2

        .fs-14.disable Collecting fees will withdraw currently available fees for you.

        alcor-button.w-100(big access) Collect

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

  props: ['tokens', 'token', 'locked'],

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
