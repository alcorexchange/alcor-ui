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
            .contrast Pooled {{ position.pool.tokenA.symbol }}
            .d-flex.gap-8.align-items-center
              .fs-14 {{ amountA }}
              token-image(:src="$tokenLogo('symbol', 'contract')" height="25")
          .d-flex.justify-content-between.align-items-center
            .contrast Pooled {{ position.pool.tokenB.symbol }}
            .d-flex.gap-8.align-items-center
              .fs-14 {{ amountB }}
              token-image(:src="$tokenLogo('symbol', 'contract')" height="25")
          .hr
          .d-flex.justify-content-between.align-items-center
            .contrast {{ position.pool.tokenA.symbol }} Fees Earned
            .d-flex.gap-8.align-items-center
              .fs-14 {{ feesA }}
              token-image(:src="$tokenLogo(position.pool.tokenA.symbol, position.pool.tokenA.contract)" height="25")
          .d-flex.justify-content-between.align-items-center
            .contrast {{ position.pool.tokenB.symbol }} Fees Earned
            .d-flex.gap-8.align-items-center
              .fs-14 {{ feesB }}
              token-image(:src="$tokenLogo(position.pool.tokenB.symbol, position.pool.tokenB.contract)" height="25")

        //- .d-flex.justify-content-between.align-items-center
        //-   .contrast Collect as TOKEN1
        //-   el-switch(
        //-     v-model='switchModel',
        //-     active-color='#13ce66',
        //-     inactive-color='#161617'
        //-   )

        alcor-button.w-100(big @click="remove") Remove
</template>

<script>
import { mapState } from 'vuex'
import { Percent } from '~/assets/libs/swap-sdk'

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

  props: ['position', 'feesA', 'feesB'],

  data: () => ({
    percent: 0,
    visible: false,

    liquidity: 0,

    search: '',
    tab: 'all',
    selected: null,

    tabs: [
      { label: 'Owned', value: 'owned' },
      { label: 'All', value: 'all' }
    ]
  }),
  computed: {
    ...mapState(['network', 'user']),

    amountA() {
      return (parseFloat(this.position.amountA.toFixed()) * (this.percent / 100)).toFixed(this.position.pool.tokenA.decimals)
    },

    amountB() {
      return (parseFloat(this.position.amountB.toFixed()) * (this.percent / 100)).toFixed(this.position.pool.tokenB.decimals)
    }
  },
  methods: {
    selectAsset(v) {
      this.$emit('selected', v)
      this.visible = false
    },

    async remove() {
      if (!this.position) return this.$notify({ type: 'Error', title: 'No position' })

      const { tokenA, tokenB } = this.position.pool
      const { owner, tickLower, tickUpper } = this.position

      const liquidity = new Percent(this.percent, 100).multiply(this.position.liquidity).quotient.toString()

      const tokenAZero = Number(0).toFixed(tokenA.decimals) + ' ' + tokenA.symbol
      const tokenBZero = Number(0).toFixed(tokenB.decimals) + ' ' + tokenB.symbol

      const actions = [{
        account: this.network.amm.contract,
        name: 'subliquid',
        authorization: [this.user.authorization],
        data: {
          poolId: this.position.pool.id,
          owner,
          liquidity,
          tickLower,
          tickUpper,
          tokenAMin: tokenAZero,
          tokenBMin: tokenBZero,
          deadline: 0
        }
      }]

      if (this.percent == 100) {
        actions.push({
          account: this.network.amm.contract,
          name: 'collect',
          authorization: [this.user.authorization],
          data: {
            poolId: this.position.pool.id,
            owner,
            recipient: owner,
            tickLower,
            tickUpper,
            tokenAMax: tokenAZero,
            tokenBMax: tokenBZero,
          }
        })
      }

      console.log({ actions })
      //return
      try {
        // TODO Notify & update position
        const result = await this.$store.dispatch('chain/sendTransaction', actions)
        if (this.percent == 100) this.$router.push('/manage-liquidity')
        this.$store.dispatch('amm/fetchPositions')
        this.visible = false
        console.log({ result })
      } catch (e) {
        console.log(e)
      }
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
