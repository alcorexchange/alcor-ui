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
          a.orderbook-hint(:href="newSwapUrl" target="_blank" rel="noopener")
            .orderbook-hint-body
              span.orderbook-hint-title Split into order book
              span.orderbook-hint-text Fills part of a swap from order book orders when they beat the pools. Available on the new Alcor.
            i.el-icon-right
</template>

<script>
import AlcorButton from '~/components/AlcorButton'
import { newAlcorUrl } from '~/utils/newAlcor'

export default {
  components: { AlcorButton },

  props: ['swapPage'],

  computed: {
    /** The same pair on the new Alcor's swap, which splits onto the order book */
    newSwapUrl() {
      const { tokenA, tokenB } = this.$store.state.amm.swap
      const path = tokenA && tokenB ? `/swap/${tokenA.id}_${tokenB.id}` : '/swap'
      return newAlcorUrl(this.$store.state.network.name, path)
    },

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

<style scoped lang="scss">
.orderbook-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  max-width: 240px;
  margin-top: 4px;
  padding-top: 8px;
  border-top: 1px solid var(--btn-default);
  color: var(--text-default);

  &:hover {
    color: var(--text-default);

    .orderbook-hint-title,
    i {
      color: var(--main-action-green);
    }
  }

  i {
    color: var(--text-disable);
    transition: color 0.2s;
  }
}

.orderbook-hint-body {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.orderbook-hint-title {
  font-size: 13px;
  font-weight: 600;
  transition: color 0.2s;
}

.orderbook-hint-text {
  font-size: 11px;
  line-height: 1.35;
  color: var(--text-disable);
}
</style>
