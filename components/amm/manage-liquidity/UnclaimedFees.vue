<template lang="pug">
.unclaimed-fees
  .d-flex.justify-content-between.mt-2
    .fs-18.disable {{ $t('Unclaimed Fees') }}
    AlcorButton.claim-fees-button.f-14(v-if="isMyPosition" access @click="submit") {{ $t('Claim Fees') }}

    // TODO Think about design
    //.mutted(v-else)
      el-tooltip(class="item" effect="dark" content="Top Center prompts info" placement="top")
        AlcorButton.claim-fees-button.f-14(access) {{ $t('Claim Fees') }}

  .d-flex.justify-content-between.mt-2
    .d-flex.align-items-center.gap-8
      span {{ position.amountA.currency.symbol }} Fees Earned
    .d-flex.align-items-center.gap-8
      .fs-18.lh-12 {{ position.feesA | commaFloat(position.pool.tokenA.decimals) }}
      .fs-14.color-action (${{ $tokenToUSD(parseFloat(position.feesA), position.pool.tokenA.symbol, position.pool.tokenA.contract) }})

  .d-flex.justify-content-between.mt-1
    .d-flex.align-items-center.gap-8
      span {{ position.amountB.currency.symbol }} Fees Earned
    .d-flex.align-items-center.gap-8
      .fs-18.lh-12 {{ position.feesB | commaFloat(position.pool.tokenB.decimals) }}
      .fs-14.color-action (${{ $tokenToUSD(parseFloat(position.feesB), position.pool.tokenB.symbol, position.pool.tokenB.contract) }})

</template>

<script>
import { mapState } from 'vuex'
import RangeIndicator from '~/components/amm/RangeIndicator'
import AlcorButton from '~/components/AlcorButton.vue'
import { getCollectActions } from '~/utils/amm'

export default {
  components: {
    RangeIndicator,
    AlcorButton
  },

  props: ['position', 'isMyPosition'],

  computed: {
    ...mapState(['network', 'user']),
  },

  methods: {
    async submit() {
      try {
        await this.collect()
        // this.$store.dispatch('amm/poolUpdate', this.position?.pool?.id)
        // this.$store.dispatch('amm/fetchPositions')
      } catch (e) {
        return this.$notify({ type: 'error', title: 'Collect Fees', message: e.message })
      }
    },

    async collect() {
      if (!this.position) return this.$notify({ type: 'Error', title: 'No position' })

      const actions = getCollectActions(this.network, this.user, this.position)

      const result = await this.$store.dispatch('chain/sendTransaction', actions)
      console.log('result', result)
    }
  }
}
</script>

<style lang="scss">
.claim-fees-button{
  padding: 2px 8px;
  font-weight: 500;
  border: none !important;
  color: var(--text-theme) !important;
  &:hover{
    background: var(--main-green) !important;
  }
}
</style>
