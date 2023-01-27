<template lang="pug">
#sale-page.d-flex.flex-column.gap-32
  return-link
  .d-flex.gap-30.justify-content-between
    .d-flex.flex-column.gap-32
      .fs-24 Visuals
    .d-flex.flex-column.gap-32
      .fs-24 Details
</template>

<script>
import ReturnLink from '~/components/ReturnLink'

export default {
  components: { ReturnLink },
  data: () => ({
    sale: null
  }),
  mounted() {
    this.getSale()
  },
  methods: {
    async getSale() {
      this.sale = await this.$store.dispatch('api/getSale', {
        sale_id: this.$route.params.id
      })
    }
  }
}
</script>
