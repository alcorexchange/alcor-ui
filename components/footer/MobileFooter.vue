<template lang="pug">
  .mobile-footer
    .sections
      MobileFooterSection(v-for="section in flatSections" :section="section")
</template>

<script>
import MobileFooterSection from './MobileFooterSection.vue'
export default {
  name: 'MobileFooter',

  components: { MobileFooterSection },

  props: ['sections'],

  computed: {
    flatSections() {
      return this.sections.flat()
    },
  },
}
</script>

<style scoped lang="scss">
.mobile-footer {
  margin-bottom: 40px;
  width: 100%;
  .sections {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
}
</style>
