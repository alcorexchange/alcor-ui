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
    this.exploreTemplates()
  },
  methods: {
    ...mapActions('api', ['getStatsTemplates']),
    exploreTemplates() {
      clearTimeout(this.debounce)
      this.debounce = setTimeout(async () => {
        this.templates = null
        const r = await this.getStatsTemplates({
          collection_name: this.$route.query?.collection,
          sort: this.$route.query?.sorting?.split('-')[0] || null,
          order: this.$route.query?.sorting?.split('-')[1] || null,
          match: this.$route.query?.match,
          max_template_mint: this.$route.query?.maxMint,
          min_template_mint: this.$route.query?.minMint,
          has_backed_tokens: !!this.$route.query?.isBacked,
          only_duplicate_templates: !!this.$route.query?.isDuplicates
        })
        this.templates = r.map(({ template }) => template)
        console.log('tttt', this.templates)
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
