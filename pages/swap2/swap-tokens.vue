<template lang="pug">
#swap-tokens
  .header
    //.pair-container(v-if="current")
      .left
        PairIcons(
          :token1="{symbol: current.pool1.quantity.symbol.code().to_string(), contract: current.pool1.contract}"
          :token2="{symbol: current.pool2.quantity.symbol.code().to_string(), contract: current.pool2.contract}"
        )
        .name-container
          .names(v-if="!isReverted") {{ current.pool1.quantity.symbol.code().to_string() }}/{{ current.pool2.quantity.symbol.code().to_string() }}
          .names(v-else) {{ current.pool2.quantity.symbol.code().to_string() }}/{{ current.pool1.quantity.symbol.code().to_string() }}

          .detail.muted {{ $t('Liquidity') }} alcor.dex
            .right
              AlcorButton.eol(@click="openInNewTab('https://docs.alcor.exchange/liquidity-pools/understanding-returns')") {{ $t('Earn On Liquidity') }}

  chart(:tab="chart_tab" :period="period")

</template>

<script>
import Chart from '~/components/swap/Chart.vue'
import PairIcons from '~/components/PairIcons'

export default {
  components: {
    Chart,
    PairIcons
  },
  data: () => ({
    chart_tab: 'Price',
    period: '7D'
  })
}
</script>
