<template lang="pug">
  .row.justify-content-center
    .col-md-12.text-center
      span.display-1.d-block 404
      .mb-4.lead(v-if="error.statusCode === 404 && error.messag == ''") {{$t("Oops! We can't seem to find the page you are looking for")}}.
      .mb-4.lead(v-else) {{ error.message }}
      nuxt-link(:to="localePath('index', $i18n.locale)").btn.btn-link {{$t('Back to Home')}}

</template>

<script>
export default {
  props: {
    error: {
      type: Object,
      default: () => { }
    }
  },

  layout: 'default'
}
</script>
