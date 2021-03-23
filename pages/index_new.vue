<template lang="pug">
.home-page
  .hero
    h2 All in one DeFi
    p.desc Alcor is a lego of decentralized finance built on multi-chain, and a provider of solutions in one tap.
    .actions
      AlcorLink(green) Start Trading
      AlcorLink Read docs
  ChainTools
</template>

<script>
import AlcorLink from '@/components/AlcorLink'
import SectionTitle from '@/components/landing/SectionTitle'
import ChainTools from '@/components/landing/ChainTools'
export default {
  components: {
    AlcorLink,
    SectionTitle,
    ChainTools
  }
}
</script>

<style scoped lang="scss"></style>
