<template lang="pug">
no-ssr
  el-dropdown(trigger="click")
    slot
      AlcorButton.action.p-0(iconOnly flat)
        i.el-icon-s-operation.pointer.fs-18
    el-dropdown-menu.dropdown(slot="dropdown")
      .px-2.d-flex.flex-column.gap-8
        label {{ $t('Transaction Setting') }}
        label.fs-14.disable {{ $t('Slippage Tolerance') }} %
        .d-flex.gap-4.section-input
          AlcorButton(@click="slippage = 0.3" round compact) {{ $t('Auto') }}
          el-input.br-20(v-model="slippage" :placeholder="$t('Slippage Tolerance %')" size="small")

        template(v-if="swapPage")
          label.fs-14.disable Max Hops:
          .d-flex.gap-4.section-input
            el-radio-group(v-model='maxHops' size='mini')
              el-radio-button(label='1')
              el-radio-button(label='2')
              el-radio-button(label='3')
          .mt-2.d-flex.gap-4
            el-checkbox(v-model="recalculateOnPriceChange") Recalculate On Price Change
</template>

<script>
import AlcorButton from '~/components/AlcorButton'

export default {
  components: { AlcorButton },

  props: ['swapPage'],

  computed: {
    maxHops: {
      set(value) {
        this.$store.commit('amm/setMaxHops', value)
      },

      get() {
        return this.$store.state.amm.maxHops
      },
    },

    slippage: {
      set(value) {
        this.$store.commit('amm/setSlippage', value)
      },

      get() {
        return this.$store.state.amm.slippage
      },
    },

    recalculateOnPriceChange: {
      set(value) {
        this.$store.commit('amm/setRecalculateOnPriceChange', value)
      },

      get() {
        return this.$store.state.amm.recalculateOnPriceChange
      },
    },
  },
}
</script>
