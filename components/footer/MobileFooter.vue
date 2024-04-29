<template lang="pug">
.mobile-footer
  .sections
    MobileFooterSection(v-for="section in flatSections" :section="section")

  .other
    FooterSocialIcons

    img.logo(:src="require(`~/assets/logos/${$colorMode.value == 'light' ? 'alcorblack' : 'alcorwhite'}.svg`)" height="38")

    span.muted © {{ new Date().getFullYear() }} Alcor
</template>

<script>
import FooterSocialIcons from './FooterSocialIcons.vue'
import MobileFooterSection from './MobileFooterSection.vue'

export default {
  name: 'MobileFooter',

  components: { MobileFooterSection, FooterSocialIcons },

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
  .other {
    padding-top: 18px;
    display: flex;
    flex-direction: column;
    gap: 24px;
    align-items: center;
  }
}
</style>
