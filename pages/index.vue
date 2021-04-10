<template lang="pug">
.home-page
  Hero.alcor-inner
  ChainTools.alcor-inner
  RecommendedMarkets.alcor-inner
  Participate
  SupportedChains
</template>

<script>
import SectionTitle from '@/components/landing/SectionTitle'
import ChainTools from '@/components/landing/ChainTools'
import Participate from '@/components/landing/Participate'
import Hero from '@/components/landing/Hero'
import SupportedChains from '@/components/landing/SupportedChains'
import RecommendedMarkets from '@/components/landing/RecommendedMarkets'
export default {
  layout: 'homeLayout',
  components: {
    SectionTitle,
    ChainTools,
    Participate,
    Hero,
    SupportedChains,
    RecommendedMarkets
  }
}
</script>

<style scoped lang="scss"></style>
