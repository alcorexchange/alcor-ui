<template lang="pug">
.d-flex.align-items-center.gap-8
  alcor-button.h-48(access big @click="visible = true")
    i.el-icon-money
    span Collect Fees

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
              token-image(:src="$tokenLogo(position.pool.tokenA.symbol, position.pool.tokenA.symbol.contract)" height="25")
              .fs-14.contrast {{ feesA }}
            .disable {{ position.pool.tokenA.symbol }}
          .d-flex.justify-content-between.align-items-center
            .d-flex.gap-8.align-items-center
              token-image(:src="$tokenLogo(position.pool.tokenB.symbol, position.pool.tokenB.symbol.contract)" height="25")
              .fs-14.contrast {{ feesB }}
            .disable {{ position.pool.tokenB.symbol }}

        .fs-14.disable Collecting fees will withdraw currently available fees for you.

        alcor-button.w-100(big access @click="collect") Collect

</template>

<script>
import { mapState } from 'vuex'
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

  props: ['position', 'feesA', 'feesB'],

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
    ...mapState(['network', 'user']),
    filteredAssets() {
      return this.assets.filter((asset) =>
        Object.values(asset)
          .join()
          .includes(this.search)
      )
    }
  },
  methods: {
    async submit() {
      if (!this.position) return this.$notify({ type: 'Error', title: 'No position' })

      try {
        // TODO Notify & update position
        this.visible = false
        setTimeout(() => {
          this.$store.dispatch('amm/poolUpdate', this.position?.pool?.id)
          this.$store.dispatch('amm/fetchPositions')
        }, 1000)
      } catch (e) {
        console.error(e)
        this.$notify({ type: 'error', title: 'Collect', message: e.message })
      }
    },

    async collect() {
      const { tokenA, tokenB } = this.position.pool
      const { owner, lower, upper } = this.position

      const tokenAZero = Number(0).toFixed(tokenA.decimals) + ' ' + tokenA.symbol
      const tokenBZero = Number(0).toFixed(tokenB.decimals) + ' ' + tokenB.symbol

      const actions = [{
        account: this.network.amm.contract,
        name: 'subliquid',
        authorization: [this.user.authorization],
        data: {
          poolId: this.position.pool.id,
          owner,
          liquidity: 0,
          tickLower: lower,
          tickUpper: upper,
          tokenAMin: tokenAZero,
          tokenBMin: tokenBZero,
          deadline: 0
        }
      }, {
        account: this.network.amm.contract,
        name: 'collect',
        authorization: [this.user.authorization],
        data: {
          poolId: this.position.pool.id,
          owner,
          recipient: owner,
          tickLower: lower,
          tickUpper: upper,
          tokenAMax: tokenAZero,
          tokenBMax: tokenBZero,
        }
      }]

      console.log({ actions })
      const result = await this.$store.dispatch('chain/sendTransaction', actions)
      console.log('result', result)
    }
  }
}
</script>
