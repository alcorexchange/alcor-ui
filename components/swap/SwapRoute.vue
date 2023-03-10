<template lang="pug">
.swap-route-component
  token-image(:src="$tokenLogo(route.input.symbol, route.input.contract)" height="24")

  .d-flex.route
    .line
    .node.mx-2 100%
    .w-100.d-flex.justify-content-around
      .node.d-flex.align-items-center.gap-8(v-for="{fee, tokenA, tokenB} in route.pools")
        pair-icons(
          :token1="{ symbol: tokenA.symbol, contract: tokenA.contract}"
          :token2="{ symbol: tokenB.symbol, contract: tokenB.contract}"
          size="24"
          direction="row"
        )
        .fs-12.ml-3 {{ fee / 10000 }}%

  token-image(src="token-conract" height="24")

</template>

<script>
import TokenImage from '~/components/elements/TokenImage'
import PairIcons from '~/components/PairIcons'

export default {
  props: ['route'],

  components: { TokenImage, PairIcons }
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
