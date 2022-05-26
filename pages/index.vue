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
  colorMode: 'dark',

  components: {
    SectionTitle,
    ChainTools,
    Participate,
    Hero,
    SupportedChains,
    RecommendedMarkets,
    Partners,
    Promoted
  }
}
</script>
