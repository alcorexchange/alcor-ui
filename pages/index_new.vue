<template lang="pug">
.home-page
  Hero
  ChainTools
  Participate
  SupportedChains
</template>

<script>
import SectionTitle from '@/components/landing/SectionTitle'
import ChainTools from '@/components/landing/ChainTools'
import Participate from '@/components/landing/Participate'
import Hero from '@/components/landing/Hero'
import SupportedChains from '@/components/landing/SupportedChains'
export default {
  components: {
    SectionTitle,
    ChainTools,
    Participate,
    Hero,
    SupportedChains
  }
}
</script>

<style scoped lang="scss"></style>
