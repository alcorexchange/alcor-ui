<template lang="pug">
#nftexplorer-page
  .d-flex.flex-wrap.gap-25
    vue-skeleton-loader(
      v-if="!templates"
      v-for="idx in [1,2,3,4]"
      :width='220',
      :height='400',
      animation='wave',
      wave-color='rgba(150, 150, 150, 0.1)',
      :rounded='true'
    )
    template-card(v-if="templates" v-for="item in templates" :key="item.template_id" :data="item")
</template>

<script>
import { mapActions } from 'vuex'
import VueSkeletonLoader from 'skeleton-loader-vue'
import TemplateCard from '~/components/cards/TemplateCard'

export default {
  components: { TemplateCard, VueSkeletonLoader },
  data: () => ({
    templates: null,
    debounce: null
  }),
  watch: {
    '$route.query'() {
      this.exploreTemplates()
    }
  },
  mounted() {
    if (!this.$route.query?.sorting)
      this.$router.push({
        query: { ...this.$route.query, sorting: 'popularity' }
      })
    this.exploreTemplates()
  },
  methods: {
    ...mapActions('api', ['getStatsTemplates', 'getTemplatesData']),
    exploreTemplates() {
      clearTimeout(this.debounce)
      this.debounce = setTimeout(async () => {
        this.templates = null
        if (this.$route.query?.sorting === 'popularity') {
          const r = await this.getStatsTemplates({
            search: this.$route.query?.match
          })
          this.templates = r.map(({ template }) => template)
        } else {
          this.templates = await this.getTemplatesData({
            sort: this.$route.query?.sorting?.split('-')[0] || null,
            order: this.$route.query?.sorting?.split('-')[1] || null,
            search: this.$route.query?.match
          })
        }
      }, 600)
    }
  }
}
</script>

<style lang="scss" scoped>
#nftexplorer-page {
  width: 100%;
  max-width: 970px;
  margin: 20px auto;
}
</style>
