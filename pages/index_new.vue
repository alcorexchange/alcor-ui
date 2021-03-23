<template lang="pug">
.home-page
  .hero
    h2 All in one DeFi
    p.desc Alcor is a lego of decentralized finance built on multi-chain, and a provider of solutions in one tap.
    .actions
      AlcorLink(green) Start Trading
      AlcorLink Read docs
</template>

<script>
import AlcorLink from '@/components/AlcorLink'
export default {
  components: {
    AlcorLink,
  },
}
</script>

<style scoped lang="scss">
</style>
