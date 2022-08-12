<template lang="pug">
  .row.justify-content-center
    .col-md-12.text-center
      image-not-found(v-if="error.type === 'PAGE_NOT_FOUND'")
      image404(v-else)
      span.display-1.d-block.error-code 404
      .mb-4.lead.message(v-if="error.statusCode === 404 && error.messag == ''") {{$t("Oops! We can't seem to find the page you are looking for")}}.
      .mb-4.lead.message(v-else) {{ error.message }}
      nuxt-link.link(:to="localePath('index', $i18n.locale)") {{$t('Back to Home')}}

</template>

<script>
import ImageNotFound from '~/components/errors/ImageNotFound.vue'
import Image404 from '~/components/errors/Image404.vue'

export default {
  components: { ImageNotFound, Image404 },
  props: {
    error: {
      type: Object,
      default: () => { }
    }
  },
  layout: 'default'
}
</script>

<style scoped>
svg {
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
