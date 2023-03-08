<template lang="pug">
.swap-route-component
  token-image(:src="$tokenLogo('WAX', 'eosio.token')" height="24")

  .d-flex.route
    .line
    .node.mx-2 50% 
    .w-100.d-flex.justify-content-around
      .node.d-flex.align-items-center.gap-8
        pair-icons(:token1="{ symbol: 'WAX', contract: 'eosio.token'}" token2="t2" size="24" direction="row")
        .fs-12.ml-3 0.1%
      .node.d-flex.align-items-center.gap-8
        pair-icons(:token1="{ symbol: 'WAX', contract: 'eosio.token'}" token2="t2" size="24" direction="row")

        .fs-12.ml-3 0.1%
      .node.d-flex.align-items-center.gap-8
        pair-icons(:token1="{ symbol: 'WAX', contract: 'eosio.token'}" token2="t2" size="24" direction="row")
        .fs-12.ml-3 0.1%

  token-image(src="token-conract" height="24")

</template>

<script>
import TokenImage from '~/components/elements/TokenImage'
import PairIcons from '~/components/PairIcons'

export default {
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
