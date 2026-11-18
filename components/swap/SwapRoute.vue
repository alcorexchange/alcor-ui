<template lang="pug">
div
  .swap-route-component(v-for="route in drawnRoutes").mb-1
    token-image(:src="$tokenLogo(tokenA.symbol, tokenA.contract)" height="24")

    .d-flex.route
      .line
      .node.mx-2 {{ route.percent }}%
      .w-100.d-flex.justify-content-around
          template(v-for="hop in route.hops")
            el-tooltip(:content="hop.tooltip" class="fee-tooltip")
              .node.d-flex.align-items-center.gap-8
                pair-icons(
                  :token1="hop.input"
                  :token2="hop.output"
                  size="24"
                  direction="row"
                )
                .fs-12.ml-3 {{ hop.label }}

    token-image(:src="$tokenLogo(tokenB.symbol, tokenB.contract)" height="24")

</template>

<script>
import TokenImage from '~/components/elements/TokenImage'
import PairIcons from '~/components/PairIcons'
import { parseTokenId } from '~/utils/amm'

// Route API v3 hop → what the route row shows. `venue` is amm, orderbook or convert (1:1 conversion).
function drawHop(hop) {
  const input = parseTokenId(hop.input)
  const output = parseTokenId(hop.output)
  const pair = `${input.symbol}/${output.symbol}`

  if (hop.venue === 'orderbook') {
    return { input, output, label: `Book ${hop.fee}%`, tooltip: `${pair} order book, market #${hop.market}` }
  }

  if (hop.venue === 'convert') {
    return { input, output, label: '1:1', tooltip: `${input.symbol} → ${output.symbol} 1:1 conversion (${hop.contract})` }
  }

  return { input, output, label: `${hop.fee}%`, tooltip: `${pair} ${hop.fee}% pool #${hop.pool}` }
}

export default {
  components: { TokenImage, PairIcons },
  props: ['routes', 'tokenA', 'tokenB'],

  computed: {
    drawnRoutes() {
      return this.routes.map(({ percent, hops }) => ({ percent, hops: hops.map(drawHop) }))
    }
  }
}
</script>

<style lang="scss" scoped>
.swap-route-component {
  display: grid;
  grid-template-columns: 24px 1fr 24px;
}

.route {
  position: relative;
  display: flex;
  align-items: center;

  .line {
    position: absolute;
    z-index: 1;
    width: 100%;
    border-bottom: 1px dashed var(--border-color);
  }

}

.node {
  background: var(--bg-alter-1);
  border-radius: 4px;
  padding: 0 4px;
  z-index: 2;
}
</style>
<style lang="scss">
.el-tooltip__popper {
  color: #F2F2F2 !important;
  background: #212121 !important;
}
</style>
