<template lang="pug">
  .row.justify-content-center
    .col-md-12.text-center
      img(:src='src', alt="error-image")
      span.display-1.d-block.error-code 404
      .mb-4.lead.message(v-if="error.statusCode === 404 && error.messag == ''") {{$t("Oops! We can't seem to find the page you are looking for")}}.
      .mb-4.lead.message(v-else) {{ error.message }}
      nuxt-link.link(:to="localePath('index', $i18n.locale)") {{$t('Back to Home')}}

</template>

<script>
export default {
  data: () => ({
    errorImage: {
      PAGE_NOT_FOUND: 'not-found.png'
    }
  }),
  props: {
    error: {
      type: Object,
      default: () => { }
    }
  },
  computed: {
    src() {
      return require(`@/assets/error/${this.errorImage[this.error.type] || 'default.png'}`)
    }
  },

  layout: 'default'
}
</script>

<style scoped>
img {
  margin-top: 52px;
  margin-bottom: 52px;
}

.error-code {
  font-weight: 400;
}

.link {
  text-decoration-line: underline !important;
  font-size: 26px;
  color: #007AFF !important;
}

.message {
  font-size: 34px;
  color: var(--text-contast);
}
</style>
