<template lang="pug">
.partners-section.alcor-inner
    SectionTitle.section-title Partners & API Providers
    .items
      a.item(v-for="{image, url, padding} in items" :href="url" target="_blank" :style="{padding}")
        img(:src="image")
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
        image: require('@/assets/images/partner-greymass.png'),
        url: 'https://greymass.com/en/'
      },
      {
        image: require('@/assets/images/partner-eos-amesterdam.png'),
        url: 'https://eosamsterdam.net/',
        padding: '40px'
      }
    ]
  })
}
</script>

<style lang="scss" scoped>
.section-title {
  padding-top: 20px;
}
.items {
  display: grid;
  gap: 20px;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  .item {
    display: flex;
    img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
  }
}
</style>
