<template lang="pug">
.mobile-footer
  .sections
    MobileFooterSection(v-for="section in flatSections" :section="section")

  .other
    FooterSocialIcons

    img.logo(:src="require(`~/assets/logos/${$colorMode.value == 'light' ? 'alcorblack' : 'alcorwhite'}.svg`)" height="38")

    GithubButton(href="https://github.com/alcorexchange/alcor-ui" data-color-scheme="no-preference: light; light: light; dark: light;" data-show-count="true" aria-label="Star alcorexchange/alcor-ui on GitHub" class="mb-2") Star

    span.muted © {{ new Date().getFullYear() }} Alcor
</template>

<script>
import GithubButton from 'vue-github-button'
import FooterSocialIcons from './FooterSocialIcons.vue'
import MobileFooterSection from './MobileFooterSection.vue'

export default {
  name: 'MobileFooter',

  components: { MobileFooterSection, FooterSocialIcons, GithubButton },

  props: ['sections'],

  computed: {
    // Flat sections because we need only sections
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
    padding: 0 8px;
    padding-top: 18px;
    display: flex;
    flex-direction: column;
    gap: 24px;
    align-items: flex-start;
  }
}
</style>
