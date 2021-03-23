<template lang="pug">
.home-page
  Hero
  ChainTools
  Participate
</template>

<script>
import SectionTitle from '@/components/landing/SectionTitle'
import ChainTools from '@/components/landing/ChainTools'
import Participate from '@/components/landing/Participate'
import Hero from '@/components/landing/Hero'
export default {
  components: {
    SectionTitle,
    ChainTools,
    Participate,
    Hero
  }
}
</script>

<style scoped lang="scss"></style>
