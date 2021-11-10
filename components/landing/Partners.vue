<template lang="pug">
.partners-section.alcor-inner
    SectionTitle.section-title Partners & API Providers
</template>

<script>
import SectionTitle from '@/components/landing/SectionTitle'
export default {
  name: 'Partners',
  components: {
    SectionTitle
  },
  data: () => ({
    items: [
      {
        image: require('@/assets/images/partner-graymass.png'),
        url: 'https://greymass.com/en/'
      }
    ]
  })
}
</script>

<style lang="scss"></style>
