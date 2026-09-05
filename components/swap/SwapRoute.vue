<template lang="pug">
div
  .swap-route-component(v-for="swap in swapsWithPools").mb-1
    token-image(:src="$tokenLogo(tokenA.symbol, tokenA.contract)" height="24")

    .d-flex.route
      .line
      .node.mx-2 {{ swap.percent }}%
      .w-100.d-flex.justify-content-around
          template(v-for="{ tokenA, tokenB, fee } in swap.route.pools")
            el-tooltip(:content="`${tokenA.symbol}/${tokenB.symbol} ${fee / 10000}% ${$t('pool')}`" class="fee-tooltip")
              .node.d-flex.align-items-center.gap-8
                pair-icons(
                  :token1="{ symbol: tokenA.symbol, contract: tokenA.contract}"
                  :token2="{ symbol: tokenB.symbol, contract: tokenB.contract}"
                  size="24"
                  direction="row"
                )
                .fs-12.ml-3 {{ fee / 10000 }}%

    token-image(:src="$tokenLogo(tokenB.symbol, tokenB.contract)" height="24")

</template>

<script>
import { mapState } from 'vuex'
import TokenImage from '~/components/elements/TokenImage'
import PairIcons from '~/components/PairIcons'
import { constructPoolInstance } from '~/utils/amm'

export default {
  components: { TokenImage, PairIcons },
  props: ['swaps', 'tokenA', 'tokenB'],

  computed: {
    ...mapState('amm', ['pools']),

    swapsWithPools() {
      return this.swaps.map(s => {
        s.route.pools = s.route.map(poolId => constructPoolInstance(this.pools.find(p => p.id == poolId)))

        return s
      })
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
