<template lang="pug">
.home-page
  Hero.alcor-inner
  ChainTools.alcor-inner
  Promoted.alcor-inner
  RecommendedMarkets.alcor-inner
  //Participate
  SupportedChains
</template>

<script>
import SectionTitle from '@/components/landing/SectionTitle'
import ChainTools from '@/components/landing/ChainTools'
import Participate from '@/components/landing/Participate'
import Hero from '@/components/landing/Hero'
import SupportedChains from '@/components/landing/SupportedChains'
import RecommendedMarkets from '@/components/landing/RecommendedMarkets'
import Partners from '@/components/landing/Partners'
import Promoted from '~/components/landing/Promoted.vue'
export default {
  layout: 'homeLayout',

  components: {
    SectionTitle,
    ChainTools,
    Participate,
    Hero,
    SupportedChains,
    RecommendedMarkets,
    Partners,
    Promoted
  },

  head() {
    const chain = this.$store.state.network.name.toUpperCase()
    return {
      title: `Alcor Exchange | ${chain} | The first self-listing Order Book DEX`
    }
  }
}

</script>

<style lang="scss">
::-webkit-scrollbar-track {
  background-color: #bfbfbf;
  border-radius: 10px;
}

::-webkit-scrollbar-thumb {
  background: #6f6f6f;
  border-radius: 5px;
}

::-webkit-scrollbar-thumb:hover {
  background: #5f5f5f;
}
</style>
